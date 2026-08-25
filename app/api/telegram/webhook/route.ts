import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { tgSendMessage, tgAnswerCallbackQuery, tgDownloadFile } from "@/lib/telegram";
import { buildPaymentDetails, MANUAL_PAYMENT_METHODS } from "@/lib/payment";
import { workerEarning } from "@/lib/commission";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

// Цена зависит от типа авто (Седан / Кроссовер / Минивэн)
const servicePrices: Record<string, number> = { express: 200000, premium: 280000, detail: 360000 };
const services: Record<string, { name: string; icon: string }> = {
  express: { name: "Седан", icon: "🚗" },
  premium: { name: "Кроссовер", icon: "🚙" },
  detail:  { name: "Минивэн", icon: "🚐" },
};

function admin() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

const serviceLabel = (id: string) => `${services[id].icon} ${services[id].name} — ${servicePrices[id].toLocaleString("ru-RU")} so'm`;
const serviceIdByLabel: Record<string, string> = Object.fromEntries(Object.keys(services).map((id) => [serviceLabel(id), id]));

// Постоянная клавиатура — закреплена внизу чата (как написал пользователь:
// "чтобы выходили все нужные кнопки"), не исчезает после одного нажатия
// и не привязана к конкретному сообщению, которое может уйти вверх по чату.
const mainKeyboard = {
  keyboard: Object.keys(services).map((id) => [{ text: serviceLabel(id) }]),
  resize_keyboard: true,
};

const locationKeyboard = {
  keyboard: [[{ text: "📍 Отправить геолокацию", request_location: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

const newOrderKeyboard = {
  inline_keyboard: [[{ text: "🔄 Новый заказ", callback_data: "menu" }]],
};

const contactKeyboard = {
  keyboard: [[{ text: "📱 Поделиться номером", request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

const paymentKeyboard = {
  inline_keyboard: [
    [{ text: "💳 Карта", callback_data: "pay:card" }],
    [{ text: "🟢 Click", callback_data: "pay:click" }],
    [{ text: "🔵 Payme", callback_data: "pay:payme" }],
    [{ text: "💵 Наличные", callback_data: "pay:cash" }],
  ],
};

function normalizePhone(raw: string) {
  return raw.replace(/\D/g, "");
}

function randomPassword() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function promptContact(chatId: number) {
  await tgSendMessage(
    chatId,
    "Чтобы заказать мойку, поделитесь номером телефона — это нужно один раз, для входа или регистрации.",
    contactKeyboard
  );
}

async function selectService(db: ReturnType<typeof admin>, chatId: number, profile: { id: string }, serviceId: string) {
  await db.from("telegram_pending_orders").upsert({
    chat_id: chatId, service_id: serviceId,
    lat: null, lng: null, location_name: null, payment_method: null,
    step: "address", updated_at: new Date().toISOString(),
  });

  const { data: addresses } = await db.from("addresses").select("id, label, address").eq("user_id", profile.id).order("is_default", { ascending: false });
  if (addresses && addresses.length > 0) {
    await tgSendMessage(chatId, "Выберите сохранённый адрес:", {
      inline_keyboard: addresses.map((a) => [{ text: `${a.label} — ${a.address}`, callback_data: `addr:${a.id}` }]),
    });
    await tgSendMessage(chatId, "Или отправьте текущую геолокацию 👇", locationKeyboard);
  } else {
    await tgSendMessage(chatId, "Отправьте геолокацию, где находится автомобиль 👇", locationKeyboard);
  }
}

// После выбора адреса/геолокации не создаём заказ сразу — сперва спрашиваем
// способ оплаты (карта/Click/Payme требуют чек, наличные — нет).
async function askPaymentMethod(db: ReturnType<typeof admin>, chatId: number, lat: number, lng: number, locationName: string) {
  await db.from("telegram_pending_orders").update({ lat, lng, location_name: locationName, step: "payment" }).eq("chat_id", chatId);
  await tgSendMessage(chatId, "Выберите способ оплаты:", paymentKeyboard);
}

async function createOrderAndReply(
  db: ReturnType<typeof admin>,
  chatId: number,
  profile: { id: string; phone: string | null },
  serviceId: string,
  lat: number,
  lng: number,
  locationName: string,
  paymentMethod: string,
  paymentStatus: string,
  receiptUrl: string | null
) {
  const svc = services[serviceId];
  const orderNumber = "W-" + Math.floor(1000 + Math.random() * 9000);

  const { error } = await db.from("orders").insert({
    user_id: profile.id,
    order_number: orderNumber,
    service_type: svc.name,
    status: "pending",
    price: servicePrices[serviceId],
    worker_earning: workerEarning(serviceId, servicePrices[serviceId]),
    location_name: locationName,
    client_lat: lat,
    client_lng: lng,
    client_phone: profile.phone,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    receipt_url: receiptUrl,
  });

  await db.from("telegram_pending_orders").delete().eq("chat_id", chatId);

  if (error) {
    await tgSendMessage(chatId, "Не удалось создать заказ. Попробуйте снова: /menu");
    return;
  }

  const paymentNote = paymentStatus === "awaiting_verification"
    ? "\n\n⏳ Чек получен, ожидайте подтверждения оплаты администратором — мойщик начнёт мойку после подтверждения."
    : "";

  await tgSendMessage(
    chatId,
    `✅ Заказ <b>${orderNumber}</b> создан!\n${svc.icon} ${svc.name} — ${servicePrices[serviceId].toLocaleString("ru-RU")} so'm${paymentNote}\n\nИщем для вас мойщика. Следить за статусом можно на сайте: ${APP_URL}/dashboard/tracking`,
    mainKeyboard
  );
}

const workerStatusLabel: Record<string, string> = {
  accepted: "Принят — выезжайте к клиенту",
  en_route: "Вы в пути",
  in_progress: "Мойка идёт",
};

type WorkerOrder = {
  id: string; order_number: string; service_type: string; price: number;
  location_name: string | null; client_phone: string | null; status: string;
  client_lat: number | null; client_lng: number | null; before_photos: string[] | null; user_id: string;
};

const WORKER_ORDER_FIELDS = "id, order_number, service_type, price, location_name, client_phone, status, client_lat, client_lng, before_photos, user_id, worker_id";

// Карточка активного заказа мойщика с кнопками по текущему статусу
async function sendWorkerOrderCard(chatId: number, order: WorkerOrder) {
  const nav = order.client_lat != null && order.client_lng != null
    ? `\n🧭 <a href="https://yandex.uz/maps/?rtext=~${order.client_lat},${order.client_lng}&rtt=auto">Открыть навигацию</a>`
    : "";
  const text =
    `📦 <b>Заказ ${order.order_number}</b>\n` +
    `${order.service_type} — <b>${Number(order.price).toLocaleString("ru-RU")} so'm</b>\n` +
    `📍 ${order.location_name || "адрес не указан"}\n` +
    `👤 Клиент: ${order.client_phone || "—"}\n` +
    `Статус: <b>${workerStatusLabel[order.status] ?? order.status}</b>` + nav;

  const rows: { text: string; callback_data: string }[][] = [];
  if (order.status === "accepted") rows.push([{ text: "🚗 Я в пути", callback_data: `wen:${order.id}` }]);
  if (order.status === "en_route") rows.push([{ text: "🧼 Начать мойку", callback_data: `wst:${order.id}` }]);
  if (order.status === "in_progress") {
    if (!(order.before_photos?.length)) rows.push([{ text: "📸 Отправьте фото ДО (пришлите фото)", callback_data: `wref:${order.id}` }]);
    rows.push([{ text: "✅ Завершить заказ", callback_data: `wdn:${order.id}` }]);
  }
  rows.push([{ text: "🔄 Обновить", callback_data: `wref:${order.id}` }]);
  await tgSendMessage(chatId, text, { inline_keyboard: rows });
}

async function showWorkerActiveOrder(db: ReturnType<typeof admin>, chatId: number, workerId: string) {
  const { data: order } = await db.from("orders").select(WORKER_ORDER_FIELDS)
    .eq("worker_id", workerId).in("status", ["accepted", "en_route", "in_progress"])
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!order) {
    await tgSendMessage(chatId, "У вас нет активных заказов. Когда вам назначат заказ — он появится здесь.");
    return;
  }
  await sendWorkerOrderCard(chatId, order as unknown as WorkerOrder);
}

// Уведомить клиента: в приложении + в Telegram, если подключён
async function notifyClient(db: ReturnType<typeof admin>, userId: string, title: string, body: string) {
  await db.from("notifications").insert({ user_id: userId, type: "order", title, body });
  const { data: cli } = await db.from("profiles").select("telegram_chat_id").eq("id", userId).maybeSingle();
  if (cli?.telegram_chat_id) await tgSendMessage(cli.telegram_chat_id as number, `${title}\n${body}`);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update = await req.json();
  const db = admin();

  // Telegram может повторно прислать одно и то же обновление при сетевых
  // сбоях — без дедупликации повтор сообщения с геолокацией создал бы
  // второй заказ. Insert конфликтует на дубликате update_id — выходим.
  if (typeof update.update_id === "number") {
    const { error: dupError } = await db.from("telegram_processed_updates").insert({ update_id: update.update_id });
    if (dupError) return NextResponse.json({ ok: true });
  }

  const message = update.message;

  // Контакт — вход (если телефон уже зарегистрирован) или начало регистрации
  if (message?.contact) {
    const chatId = message.chat.id as number;

    // Telegram присылает message.contact и при нажатии кнопки "Поделиться номером"
    // (надёжно — это подтверждённый номер самого отправителя), и при пересылке
    // ЛЮБОЙ контакт-карточки из адресной книги (ненадёжно — там может быть чужой
    // номер). Различить эти случаи можно по contact.user_id: он совпадает с
    // отправителем только в первом случае. Без этой проверки можно было привязать
    // чужой аккаунт, просто переслав боту контакт с его номером телефона.
    if (message.contact.user_id !== message.from?.id) {
      await tgSendMessage(chatId, "Похоже, это не ваш номер. Нажмите кнопку «Поделиться номером», чтобы отправить свой собственный.", contactKeyboard);
      return NextResponse.json({ ok: true });
    }

    const phone = normalizePhone(message.contact.phone_number);

    // Номер в profiles исторически мог сохраниться и как "998…", и как "+998…" —
    // ищем по обоим вариантам, чтобы повторный вход всегда находил аккаунт.
    const { data: existingRows } = await db.from("profiles").select("id, name, role").in("phone", [phone, "+" + phone]).limit(1);
    const existing = existingRows?.[0];

    if (existing) {
      // Админ подключает Telegram — сюда будут падать уведомления о новых заказах
      if (existing.role === "ADMIN") {
        await db.from("profiles").update({ telegram_chat_id: chatId }).eq("id", existing.id);
        await tgSendMessage(chatId, `Здравствуйте, ${existing.name}! Вы вошли как администратор — сюда будут приходить уведомления о каждом новом заказе 🔔`, { remove_keyboard: true });
        return NextResponse.json({ ok: true });
      }
      // Мойщик подключается — сюда приходят его заказы, и он ведёт их прямо в боте
      if (existing.role === "WORKER") {
        await db.from("profiles").update({ telegram_chat_id: chatId }).eq("id", existing.id);
        await tgSendMessage(chatId, `Здравствуйте, ${existing.name}! Вы вошли как мойщик 👷 Заказы будут приходить сюда.`, { remove_keyboard: true });
        await showWorkerActiveOrder(db, chatId, existing.id);
        return NextResponse.json({ ok: true });
      }
      await db.from("profiles").update({ telegram_chat_id: chatId }).eq("id", existing.id);
      await tgSendMessage(chatId, `Здравствуйте, ${existing.name}! Вход выполнен ✅`, { remove_keyboard: true });
      await tgSendMessage(chatId, "Выберите услугу 👇", mainKeyboard);
      return NextResponse.json({ ok: true });
    }

    await db.from("telegram_registrations").upsert({ chat_id: chatId, phone, step: "name", name: null });
    await tgSendMessage(chatId, "Это новый номер. Как вас зовут?", { remove_keyboard: true });
    return NextResponse.json({ ok: true });
  }

  // /start или /menu
  if (message?.text === "/start" || message?.text === "/menu") {
    const chatId = message.chat.id as number;
    const { data: profile } = await db.from("profiles").select("id, role").eq("telegram_chat_id", chatId).maybeSingle();

    if (!profile) {
      await promptContact(chatId);
    } else if (profile.role === "WORKER") {
      await showWorkerActiveOrder(db, chatId, profile.id);
    } else if (profile.role === "ADMIN") {
      await tgSendMessage(chatId, "Вы админ 🔔 Уведомления о новых заказах приходят сюда — назначайте мойщика прямо из них.", { remove_keyboard: true });
    } else {
      await tgSendMessage(chatId, "Выберите услугу 👇", mainKeyboard);
    }
    return NextResponse.json({ ok: true });
  }

  // Геолокация — последний шаг заказа
  if (message?.location) {
    const chatId = message.chat.id as number;
    const clientLat = message.location.latitude;
    const clientLng = message.location.longitude;

    const { data: pending } = await db.from("telegram_pending_orders").select("service_id").eq("chat_id", chatId).maybeSingle();
    if (!pending) {
      await tgSendMessage(chatId, "Сначала выберите услугу: /menu");
      return NextResponse.json({ ok: true });
    }

    const { data: profile } = await db.from("profiles").select("id, phone").eq("telegram_chat_id", chatId).maybeSingle();
    if (!profile) {
      await promptContact(chatId);
      return NextResponse.json({ ok: true });
    }

    await askPaymentMethod(db, chatId, clientLat, clientLng, "Из Telegram-бота (геолокация)");
    return NextResponse.json({ ok: true });
  }

  // Фото чека — последний шаг ручной оплаты (карта/Click/Payme)
  if (message?.photo) {
    const chatId = message.chat.id as number;
    const photoArr = message.photo as { file_id: string }[];
    const bestFileId = photoArr[photoArr.length - 1].file_id;

    // Фото от мойщика — «до / после» мойки
    const { data: worker } = await db.from("profiles").select("id, role").eq("telegram_chat_id", chatId).maybeSingle();
    if (worker?.role === "WORKER") {
      const { data: active } = await db.from("orders")
        .select("id, before_photos, after_photos, status, user_id")
        .eq("worker_id", worker.id).in("status", ["en_route", "in_progress"])
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (active) {
        let url: string;
        try {
          const bytes = await tgDownloadFile(bestFileId);
          const path = `${active.id}/${Date.now()}.jpg`;
          const { error: upErr } = await db.storage.from("wash-photos").upload(path, bytes, { contentType: "image/jpeg" });
          if (upErr) throw upErr;
          url = db.storage.from("wash-photos").getPublicUrl(path).data.publicUrl;
        } catch {
          await tgSendMessage(chatId, "Не удалось сохранить фото, попробуйте ещё раз.");
          return NextResponse.json({ ok: true });
        }
        if (!(active.before_photos?.length)) {
          await db.from("orders").update({ before_photos: [url], status: "in_progress" }).eq("id", active.id);
          await tgSendMessage(chatId, "✅ Фото ДО сохранено. Помойте машину, пришлите фото ПОСЛЕ, затем нажмите «Завершить заказ».");
        } else {
          await db.from("orders").update({ after_photos: [...(active.after_photos ?? []), url] }).eq("id", active.id);
          await tgSendMessage(chatId, "✅ Фото ПОСЛЕ сохранено. Можно отправить ещё или нажать «Завершить заказ».");
        }
        return NextResponse.json({ ok: true });
      }
    }

    const { data: pending } = await db.from("telegram_pending_orders").select("*").eq("chat_id", chatId).maybeSingle();
    if (!pending || pending.step !== "receipt" || !pending.payment_method) {
      await tgSendMessage(chatId, "Сначала выберите услугу: /menu");
      return NextResponse.json({ ok: true });
    }

    const { data: profile } = await db.from("profiles").select("id, phone").eq("telegram_chat_id", chatId).maybeSingle();
    if (!profile) {
      await promptContact(chatId);
      return NextResponse.json({ ok: true });
    }

    const photos = message.photo as { file_id: string }[];
    const fileId = photos[photos.length - 1].file_id;

    let receiptUrl: string | null = null;
    try {
      const bytes = await tgDownloadFile(fileId);
      const path = `${profile.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await db.storage.from("payment-receipts").upload(path, bytes, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      receiptUrl = db.storage.from("payment-receipts").getPublicUrl(path).data.publicUrl;
    } catch {
      await tgSendMessage(chatId, "Не удалось сохранить чек, попробуйте отправить фото ещё раз.");
      return NextResponse.json({ ok: true });
    }

    await createOrderAndReply(
      db, chatId, profile, pending.service_id, pending.lat, pending.lng, pending.location_name,
      pending.payment_method, "awaiting_verification", receiptUrl
    );
    return NextResponse.json({ ok: true });
  }

  // Обычный текст — выбор услуги постоянной кнопкой, шаг регистрации (имя), либо подсказка
  if (message?.text && !message.text.startsWith("/")) {
    const chatId = message.chat.id as number;

    const matchedServiceId = serviceIdByLabel[message.text];
    if (matchedServiceId) {
      const { data: profile } = await db.from("profiles").select("id, phone").eq("telegram_chat_id", chatId).maybeSingle();
      if (!profile) {
        await promptContact(chatId);
        return NextResponse.json({ ok: true });
      }
      await selectService(db, chatId, profile, matchedServiceId);
      return NextResponse.json({ ok: true });
    }

    const { data: pendingReg } = await db.from("telegram_registrations").select("phone, step, name").eq("chat_id", chatId).maybeSingle();

    if (pendingReg?.step === "name") {
      const name = message.text.trim().slice(0, 80);

      // Регистрация по телефону — email больше не нужен (весь проект на телефоне).
      // Номер уже подтверждён (пользователь поделился контактом), поэтому создаём
      // аккаунт сразу: телефон + имя + случайный пароль для входа на сайте.
      const password = randomPassword();
      const { data: created, error: createError } = await db.auth.admin.createUser({
        phone: pendingReg.phone,
        phone_confirm: true,
        password,
        user_metadata: { name, role: "USER" },
      });

      if (createError || !created.user) {
        // Всегда убираем незавершённую регистрацию, чтобы не застрять в цикле
        await db.from("telegram_registrations").delete().eq("chat_id", chatId);

        // Номер уже зарегистрирован — не ругаемся, а просто входим
        if (/already.*registered|already been registered|phone.*exists/i.test(createError?.message ?? "")) {
          const { data: rows } = await db.from("profiles").select("id, name, role").in("phone", [pendingReg.phone, "+" + pendingReg.phone]).limit(1);
          const prof = rows?.[0];
          if (prof && prof.role === "USER") {
            await db.from("profiles").update({ telegram_chat_id: chatId }).eq("id", prof.id);
            await tgSendMessage(chatId, `С возвращением, ${prof.name}! Вы вошли ✅`, { remove_keyboard: true });
            await tgSendMessage(chatId, "Выберите услугу 👇", mainKeyboard);
          } else {
            await tgSendMessage(chatId, "Этот номер уже используется в системе. Нажмите «Поделиться номером», чтобы войти.", contactKeyboard);
          }
          return NextResponse.json({ ok: true });
        }

        await tgSendMessage(chatId, "Не удалось создать аккаунт. Попробуйте снова: /menu", contactKeyboard);
        return NextResponse.json({ ok: true });
      }

      await db.from("profiles").update({ name, phone: pendingReg.phone, telegram_chat_id: chatId }).eq("id", created.user.id);
      await db.from("telegram_registrations").delete().eq("chat_id", chatId);

      await tgSendMessage(chatId, `Готово, ${name}! Добро пожаловать в Wash Go 🎉 Вы вошли.`, { remove_keyboard: true });
      await tgSendMessage(chatId, "Выберите услугу 👇", mainKeyboard);
      return NextResponse.json({ ok: true });
    }

    const { data: profile } = await db.from("profiles").select("id").eq("telegram_chat_id", chatId).maybeSingle();
    if (profile) {
      await tgSendMessage(chatId, "Используйте /menu, чтобы заказать мойку.");
    } else {
      await promptContact(chatId);
    }
    return NextResponse.json({ ok: true });
  }

  const callback = update.callback_query;

  // Админ назначает заказ мойщику прямо из уведомления в Telegram
  if (callback?.data?.startsWith("asg:")) {
    const chatId = callback.message.chat.id as number;
    const [, orderId, workerPrefix] = callback.data.split(":");

    const { data: adminProf } = await db.from("profiles").select("id, role").eq("telegram_chat_id", chatId).maybeSingle();
    if (!adminProf || adminProf.role !== "ADMIN") {
      await tgAnswerCallbackQuery(callback.id, "Доступно только администратору");
      return NextResponse.json({ ok: true });
    }

    const { data: order } = await db.from("orders").select("id, order_number, service_type, status, user_id").eq("id", orderId).maybeSingle();
    if (!order) {
      await tgAnswerCallbackQuery(callback.id, "Заказ не найден");
      return NextResponse.json({ ok: true });
    }
    if (order.status !== "pending") {
      await tgAnswerCallbackQuery(callback.id, "Заказ уже принят или отменён");
      return NextResponse.json({ ok: true });
    }

    const { data: workers } = await db.from("profiles").select("id, name, phone, telegram_chat_id").eq("role", "WORKER");
    const worker = (workers ?? []).find((w) => (w.id as string).startsWith(workerPrefix));
    if (!worker) {
      await tgAnswerCallbackQuery(callback.id, "Мойщик не найден");
      return NextResponse.json({ ok: true });
    }

    const { data: upd } = await db.from("orders")
      .update({ worker_id: worker.id, worker_name: worker.name, worker_phone: worker.phone, status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", orderId).eq("status", "pending").select("id").maybeSingle();
    if (!upd) {
      await tgAnswerCallbackQuery(callback.id, "Заказ уже приняли");
      return NextResponse.json({ ok: true });
    }

    await tgAnswerCallbackQuery(callback.id, `Назначено: ${worker.name}`);
    await tgSendMessage(chatId, `✅ Заказ <b>${order.order_number}</b> назначен мойщику: <b>${worker.name}</b>`);

    // Уведомляем клиента (в приложении) и мойщика в Telegram, если он подключён
    await db.from("notifications").insert({
      user_id: order.user_id, type: "order", title: "Мойщик назначен!",
      body: `${worker.name} назначен на ваш заказ ${order.order_number} и скоро будет в пути.`,
    });
    if (worker.telegram_chat_id) {
      await tgSendMessage(worker.telegram_chat_id as number, `🚗 Вам назначен новый заказ <b>${order.order_number}</b>!`);
      await showWorkerActiveOrder(db, worker.telegram_chat_id as number, worker.id as string);
    }
    return NextResponse.json({ ok: true });
  }

  // Мойщик ведёт заказ прямо в боте: в пути → начать → завершить
  if (callback?.data && /^(wen|wst|wdn|wref):/.test(callback.data)) {
    const chatId = callback.message.chat.id as number;
    const [action, orderId] = callback.data.split(":");

    const { data: worker } = await db.from("profiles").select("id, role").eq("telegram_chat_id", chatId).maybeSingle();
    if (!worker || worker.role !== "WORKER") {
      await tgAnswerCallbackQuery(callback.id, "Доступно только мойщику");
      return NextResponse.json({ ok: true });
    }
    const { data: orderRaw } = await db.from("orders").select(WORKER_ORDER_FIELDS).eq("id", orderId).maybeSingle();
    const order = orderRaw as unknown as (WorkerOrder & { worker_id: string | null }) | null;
    if (!order || order.worker_id !== worker.id) {
      await tgAnswerCallbackQuery(callback.id, "Заказ не ваш или не найден");
      return NextResponse.json({ ok: true });
    }

    if (action === "wen" && order.status === "accepted") {
      await db.from("orders").update({ status: "en_route" }).eq("id", orderId);
      order.status = "en_route";
      await notifyClient(db, order.user_id, "Мойщик в пути 🚗", `Мойщик выехал к вам по заказу ${order.order_number}.`);
      await tgAnswerCallbackQuery(callback.id, "Статус: в пути");
    } else if (action === "wst" && order.status === "en_route") {
      await db.from("orders").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", orderId);
      order.status = "in_progress";
      await notifyClient(db, order.user_id, "Мойка началась 🧼", `Мойщик приступил к заказу ${order.order_number}.`);
      await tgAnswerCallbackQuery(callback.id, "Мойка началась");
      await tgSendMessage(chatId, "📸 Отправьте фото <b>ДО</b> мойки — просто пришлите фото сюда.");
    } else if (action === "wdn" && order.status === "in_progress") {
      await db.from("orders").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", orderId);
      await notifyClient(db, order.user_id, "Мойка завершена ✨", `Заказ ${order.order_number} выполнен. Оцените мойщика в приложении!`);
      await tgAnswerCallbackQuery(callback.id, "Заказ завершён");
      await tgSendMessage(chatId, `✅ Заказ <b>${order.order_number}</b> завершён. Спасибо за работу!`);
      return NextResponse.json({ ok: true });
    } else if (action === "wref") {
      await tgAnswerCallbackQuery(callback.id);
    } else {
      await tgAnswerCallbackQuery(callback.id, "Сейчас это действие недоступно");
    }
    await sendWorkerOrderCard(chatId, order as WorkerOrder);
    return NextResponse.json({ ok: true });
  }

  // Выбор сохранённого адреса
  if (callback?.data?.startsWith("addr:")) {
    const chatId = callback.message.chat.id as number;
    const addressId = callback.data.slice(5);

    const { data: profile } = await db.from("profiles").select("id, phone").eq("telegram_chat_id", chatId).maybeSingle();
    const { data: pending } = await db.from("telegram_pending_orders").select("service_id").eq("chat_id", chatId).maybeSingle();
    if (!profile || !pending) {
      await tgAnswerCallbackQuery(callback.id, "Сначала выберите услугу: /menu");
      return NextResponse.json({ ok: true });
    }

    const { data: address } = await db.from("addresses").select("address, lat, lng").eq("id", addressId).eq("user_id", profile.id).maybeSingle();
    if (!address) {
      await tgAnswerCallbackQuery(callback.id, "Адрес не найден");
      return NextResponse.json({ ok: true });
    }

    await tgAnswerCallbackQuery(callback.id, "Адрес выбран");
    await askPaymentMethod(db, chatId, address.lat, address.lng, address.address);
    return NextResponse.json({ ok: true });
  }

  // Выбор способа оплаты
  if (callback?.data?.startsWith("pay:")) {
    const chatId = callback.message.chat.id as number;
    const method = callback.data.slice(4);

    const { data: profile } = await db.from("profiles").select("id, phone").eq("telegram_chat_id", chatId).maybeSingle();
    const { data: pending } = await db.from("telegram_pending_orders").select("*").eq("chat_id", chatId).maybeSingle();

    if (!profile || !pending || pending.lat == null) {
      await tgAnswerCallbackQuery(callback.id, "Сначала выберите услугу и адрес: /menu");
      return NextResponse.json({ ok: true });
    }

    await tgAnswerCallbackQuery(callback.id);

    if (method === "cash" || !MANUAL_PAYMENT_METHODS.includes(method)) {
      await createOrderAndReply(db, chatId, profile, pending.service_id, pending.lat, pending.lng, pending.location_name, "cash", "unpaid", null);
      return NextResponse.json({ ok: true });
    }

    const { data: settings } = await db.from("app_settings").select("payment_card_number, payment_click_number, payment_payme_number").eq("id", 1).maybeSingle();
    const detail = buildPaymentDetails(settings ?? null)[method];

    await db.from("telegram_pending_orders").update({ payment_method: method, step: "receipt" }).eq("chat_id", chatId);
    await tgSendMessage(
      chatId,
      `Переведите <b>${servicePrices[pending.service_id].toLocaleString("ru-RU")} so'm</b> на:\n${detail.label}: <code>${detail.value}</code>\n\nЗатем отправьте сюда фото или скрин чека 📸`
    );
    return NextResponse.json({ ok: true });
  }

  // Оценка мойщика звёздами
  if (callback?.data?.startsWith("rate:")) {
    const chatId = callback.message.chat.id as number;
    const [, orderId, ratingStr] = callback.data.split(":");
    const rating = Number(ratingStr);

    const { data: profile } = await db.from("profiles").select("id").eq("telegram_chat_id", chatId).maybeSingle();
    const { data: order } = await db.from("orders").select("user_id, user_rating").eq("id", orderId).maybeSingle();

    if (!profile || !order || order.user_id !== profile.id) {
      await tgAnswerCallbackQuery(callback.id, "Не удалось сохранить оценку");
      return NextResponse.json({ ok: true });
    }
    if (order.user_rating != null) {
      await tgAnswerCallbackQuery(callback.id, "Вы уже оценили этот заказ");
      return NextResponse.json({ ok: true });
    }

    await db.from("orders").update({ user_rating: rating }).eq("id", orderId);
    await tgAnswerCallbackQuery(callback.id, "Спасибо за оценку!");
    await tgSendMessage(chatId, `Спасибо за оценку — ${"⭐".repeat(rating)}!`, newOrderKeyboard);
    return NextResponse.json({ ok: true });
  }

  // Кнопка "Новый заказ"
  if (callback?.data === "menu") {
    const chatId = callback.message.chat.id as number;
    await tgAnswerCallbackQuery(callback.id);

    const { data: profile } = await db.from("profiles").select("id").eq("telegram_chat_id", chatId).maybeSingle();
    if (!profile) {
      await promptContact(chatId);
    } else {
      await tgSendMessage(chatId, "Выберите услугу 👇", mainKeyboard);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
