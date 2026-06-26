"use client";

import Navbar from "@/components/layout/Navbar";
import { useLanguage, type Lang } from "@/lib/i18n";

type SectionData = { title: string; paragraphs?: string[]; list?: string[] };
type PrivacyContent = { heading: string; subheading: string; sections: SectionData[] };

const CONTENT: Record<Lang, PrivacyContent> = {
  ru: {
    heading: "Политика конфиденциальности",
    subheading: "Как Wash Go собирает, использует и защищает ваши данные",
    sections: [
      { title: "1. Какие данные мы собираем", paragraphs: [
        "1.1. При регистрации: имя, номер телефона.",
        "1.2. При заказе: адрес мойки (геолокация), выбранная услуга, способ оплаты, фото квитанции при оплате переводом.",
        "1.3. Во время выполнения заказа: живая геолокация мойщика (для отображения на карте клиенту и администратору), фото автомобиля до и после мойки.",
        "1.4. Для мойщиков дополнительно: номер карты для выплат заработка.",
        "1.5. Технические данные: push-токен устройства (для уведомлений), журнал ошибок приложения, IP-адрес при обращении к серверу.",
      ]},
      { title: "2. Для чего используются данные", list: [
        "оказание услуги — назначение мойщика, построение маршрута, отображение статуса заказа",
        "проверка и подтверждение оплаты администратором",
        "связь с вами по заказу (уведомления о статусе, push, сообщения в Telegram)",
        "выплата заработка мойщикам",
        "рассмотрение претензий по качеству услуги (фото до/после)",
        "улучшение работы Сервиса и устранение технических сбоев",
      ]},
      { title: "3. Кому передаются данные", paragraphs: [
        "Мы не продаём ваши данные третьим лицам. Данные передаются только техническим подрядчикам, необходимым для работы Сервиса:",
      ], list: [
        "Supabase — база данных, авторизация и хранение фото (серверы, на которых работает Сервис)",
        "Vercel — хостинг сайта и API",
        "Telegram — если вы используете бота или Mini App, для отправки сообщений",
        "Eskiz.uz — отправка SMS-кодов подтверждения номера телефона",
        "Firebase (Google) — доставка push-уведомлений на Android-устройства",
      ]},
      { title: "4. Хранение и защита данных", paragraphs: [
        "4.1. Данные хранятся на серверах Supabase с разграничением доступа (Row Level Security) — пользователь видит только свои данные, мойщик — только данные по своим заказам, администратор — данные, необходимые для модерации.",
        "4.2. Пароли хранятся в зашифрованном виде и недоступны даже сотрудникам Сервиса.",
        "4.3. Фото квитанций и номера карт используются исключительно для подтверждения оплаты и выплат и не публикуются.",
      ]},
      { title: "5. Ваши права", paragraphs: [
        "5.1. Вы можете в любой момент посмотреть и изменить свои данные в разделе «Профиль» / «Настройки» приложения.",
        "5.2. Вы можете полностью удалить свой аккаунт и связанные с ним данные через «Настройки → Удалить аккаунт». Удаление необратимо.",
        "5.3. По вопросам, связанным с вашими персональными данными, можно обратиться через поддержку в приложении или Telegram-бот Wash Go.",
      ]},
      { title: "6. Изменение политики", paragraphs: [
        "6.1. Мы можем обновлять эту страницу по мере развития Сервиса. Существенные изменения будут анонсированы в приложении.",
      ]},
    ],
  },
  en: {
    heading: "Privacy Policy",
    subheading: "How Wash Go collects, uses, and protects your data",
    sections: [
      { title: "1. What data we collect", paragraphs: [
        "1.1. At registration: name, phone number.",
        "1.2. When ordering: wash address (geolocation), selected service, payment method, payment receipt photo for transfer payments.",
        "1.3. During order fulfillment: the worker's live location (shown on the map to the client and administrator), photos of the car before and after the wash.",
        "1.4. For workers additionally: card number for earnings payouts.",
        "1.5. Technical data: device push token (for notifications), app error logs, IP address when contacting the server.",
      ]},
      { title: "2. How the data is used", list: [
        "providing the service — assigning a worker, building the route, showing order status",
        "verifying and confirming payment by the administrator",
        "contacting you about the order (status notifications, push, Telegram messages)",
        "paying workers' earnings",
        "reviewing complaints about service quality (before/after photos)",
        "improving the Service and fixing technical issues",
      ]},
      { title: "3. Who the data is shared with", paragraphs: [
        "We do not sell your data to third parties. Data is shared only with technical processors necessary for the Service to operate:",
      ], list: [
        "Supabase — database, authentication, and photo storage (the servers the Service runs on)",
        "Vercel — website and API hosting",
        "Telegram — if you use the bot or Mini App, for sending messages",
        "Eskiz.uz — sending SMS confirmation codes for your phone number",
        "Firebase (Google) — delivering push notifications to Android devices",
      ]},
      { title: "4. Storage and protection", paragraphs: [
        "4.1. Data is stored on Supabase servers with access control (Row Level Security) — a user sees only their own data, a worker only data related to their orders, an administrator only the data needed for moderation.",
        "4.2. Passwords are stored encrypted and are not accessible even to Service staff.",
        "4.3. Payment receipt photos and card numbers are used solely to confirm payments and payouts and are never published.",
      ]},
      { title: "5. Your rights", paragraphs: [
        "5.1. You can view and edit your data at any time in the \"Profile\"/\"Settings\" section of the app.",
        "5.2. You can fully delete your account and its associated data via \"Settings → Delete Account.\" Deletion is irreversible.",
        "5.3. For questions about your personal data, contact us through in-app support or the Wash Go Telegram bot.",
      ]},
      { title: "6. Changes to this policy", paragraphs: [
        "6.1. We may update this page as the Service evolves. Significant changes will be announced in the app.",
      ]},
    ],
  },
  uz: {
    heading: "Maxfiylik siyosati",
    subheading: "Wash Go ma'lumotlaringizni qanday to'playdi, ishlatadi va himoya qiladi",
    sections: [
      { title: "1. Qanday ma'lumotlarni to'playmiz", paragraphs: [
        "1.1. Ro'yxatdan o'tishda: ism, telefon raqami.",
        "1.2. Buyurtma berishda: yuvish manzili (geolokatsiya), tanlangan xizmat, to'lov usuli, o'tkazma orqali to'lashda chek surati.",
        "1.3. Buyurtmani bajarish davomida: yuvuvchining jonli joylashuvi (mijoz va administratorga xaritada ko'rsatish uchun), avtomobilning yuvishdan oldin va keyingi suratlari.",
        "1.4. Yuvuvchilar uchun qo'shimcha: daromadni to'lash uchun karta raqami.",
        "1.5. Texnik ma'lumotlar: bildirishnomalar uchun qurilma push-tokeni, ilova xatolari jurnali, serverga murojaat qilishda IP-manzil.",
      ]},
      { title: "2. Ma'lumotlar nima uchun ishlatiladi", list: [
        "xizmat ko'rsatish — yuvuvchini tayinlash, marshrutni qurish, buyurtma holatini ko'rsatish",
        "to'lovni administrator tomonidan tekshirish va tasdiqlash",
        "buyurtma bo'yicha siz bilan aloqa (holat haqida bildirishnomalar, push, Telegramdagi xabarlar)",
        "yuvuvchilarning daromadini to'lash",
        "xizmat sifati bo'yicha shikoyatlarni ko'rib chiqish (oldin/keyin suratlari)",
        "Xizmatni yaxshilash va texnik nosozliklarni bartaraf etish",
      ]},
      { title: "3. Ma'lumotlar kimga uzatiladi", paragraphs: [
        "Biz sizning ma'lumotlaringizni uchinchi shaxslarga sotmaymiz. Ma'lumotlar faqat Xizmat ishlashi uchun zarur bo'lgan texnik pudratchilarga uzatiladi:",
      ], list: [
        "Supabase — ma'lumotlar bazasi, avtorizatsiya va suratlarni saqlash (Xizmat ishlaydigan serverlar)",
        "Vercel — sayt va API hostingi",
        "Telegram — agar siz bot yoki Mini App'dan foydalansangiz, xabarlar yuborish uchun",
        "Eskiz.uz — telefon raqamini tasdiqlash uchun SMS-kodlar yuborish",
        "Firebase (Google) — Android qurilmalarga push-bildirishnomalarni yetkazib berish",
      ]},
      { title: "4. Saqlash va himoya qilish", paragraphs: [
        "4.1. Ma'lumotlar Supabase serverlarida kirishni cheklash (Row Level Security) bilan saqlanadi — foydalanuvchi faqat o'z ma'lumotlarini, yuvuvchi faqat o'z buyurtmalariga oid ma'lumotlarni, administrator esa moderatsiya uchun zarur ma'lumotlarni ko'radi.",
        "4.2. Parollar shifrlangan holda saqlanadi va Xizmat xodimlari uchun ham mavjud emas.",
        "4.3. To'lov cheklarining suratlari va karta raqamlari faqat to'lovlar va to'lovlarni tasdiqlash uchun ishlatiladi va hech qachon e'lon qilinmaydi.",
      ]},
      { title: "5. Sizning huquqlaringiz", paragraphs: [
        "5.1. O'z ma'lumotlaringizni istalgan vaqtda ilovaning \"Profil\"/\"Sozlamalar\" bo'limida ko'rishingiz va o'zgartirishingiz mumkin.",
        "5.2. \"Sozlamalar → Hisobni o'chirish\" orqali hisobingizni va unga tegishli barcha ma'lumotlarni butunlay o'chirib tashlashingiz mumkin. O'chirish qaytarib bo'lmaydi.",
        "5.3. Shaxsiy ma'lumotlaringiz bo'yicha savollar uchun ilovadagi qo'llab-quvvatlash xizmati yoki Wash Go Telegram boti orqali murojaat qiling.",
      ]},
      { title: "6. Siyosatdagi o'zgarishlar", paragraphs: [
        "6.1. Xizmat rivojlanishi bilan biz bu sahifani yangilab turishimiz mumkin. Muhim o'zgarishlar ilovada e'lon qilinadi.",
      ]},
    ],
  },
};

export default function PrivacyPage() {
  const { lang } = useLanguage();
  const content = CONTENT[lang];

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <h1 className="text-4xl font-black text-slate-900 mb-2">{content.heading}</h1>
        <p className="text-sm text-slate-400 mb-10">{content.subheading}</p>

        <div className="space-y-8 text-slate-600 text-sm leading-relaxed">
          {content.sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-bold text-slate-900 mb-3">{s.title}</h2>
              <div className="space-y-2">
                {s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
                {s.list && (
                  <ul className="list-disc pl-5 space-y-1.5">
                    {s.list.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
