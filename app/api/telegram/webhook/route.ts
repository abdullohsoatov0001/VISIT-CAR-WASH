import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { tgSendMessage, tgAnswerCallbackQuery, tgDownloadFile } from "@/lib/telegram";
import { buildPaymentDetails, MANUAL_PAYMENT_METHODS } from "@/lib/payment";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

const servicePrices: Record<string, number> = { express: 49000, premium: 99000, detail: 199000, eco: 59000 };
const services: Record<string, { name: string; icon: string }> = {
  express: { name: "Express Wash", icon: "⚡" },
  premium: { name: "Premium Wash", icon: "✨" },
  detail:  { name: "Detail Wash",  icon: "💎" },
  eco:     { name: "Eco Wash",     icon: "🌿" },
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

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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

    const { data: existing } = await db.from("profiles").select("id, name, role").eq("phone", phone).maybeSingle();

    if (existing) {
      if (existing.role !== "USER") {
        await tgSendMessage(chatId, "Этот номер привязан к аккаунту мойщика/администратора. Заказы через бота доступны только клиентам.", { remove_keyboard: true });
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
    const { data: profile } = await db.from("profiles").select("id").eq("telegram_chat_id", chatId).maybeSingle();

    if (!profile) {
      await promptContact(chatId);
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

  // Обычный текст — выбор услуги постоянной кнопкой, шаги регистрации (имя → email), либо подсказка
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
      await db.from("telegram_registrations").update({ name, step: "email" }).eq("chat_id", chatId);
      await tgSendMessage(chatId, `Приятно познакомиться, ${name}! Теперь укажите email — он понадобится, чтобы заходить и на сайт.`);
      return NextResponse.json({ ok: true });
    }

    if (pendingReg?.step === "email") {
      const email = message.text.trim().toLowerCase();
      if (!isValidEmail(email)) {
        await tgSendMessage(chatId, "Это не похоже на email. Введите, например, name@example.com");
        return NextResponse.json({ ok: true });
      }

      const password = randomPassword();
      const { data: created, error: createError } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone: pendingReg.phone,
        phone_confirm: true,
        user_metadata: { name: pendingReg.name, role: "USER" },
      });

      if (createError || !created.user) {
        const msg = createError?.message?.includes("already been registered")
          ? "Этот email уже зарегистрирован. Войдите на сайте под этим email и привяжите свой номер телефона в настройках."
          : "Не удалось создать аккаунт. Попробуйте другой email.";
        await tgSendMessage(chatId, msg);
        return NextResponse.json({ ok: true });
      }

      await db.from("profiles").update({ name: pendingReg.name, phone: pendingReg.phone, telegram_chat_id: chatId }).eq("id", created.user.id);
      await db.from("telegram_registrations").delete().eq("chat_id", chatId);

      await tgSendMessage(
        chatId,
        `Аккаунт создан! Добро пожаловать, ${pendingReg.name} 🎉\n\nДанные для входа на сайт:\nEmail: <code>${email}</code>\nПароль: <code>${password}</code>\n\nРекомендуем сменить пароль в Настройках на сайте.`
      );
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
