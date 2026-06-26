"use client";

import Navbar from "@/components/layout/Navbar";
import { useLanguage, type Lang } from "@/lib/i18n";

type SectionData = { title: string; paragraphs: string[] };
type TermsContent = { heading: string; subheading: string; sections: SectionData[] };

const CONTENT: Record<Lang, TermsContent> = {
  ru: {
    heading: "Пользовательское соглашение",
    subheading: "Публичная оферта · действует с момента регистрации в Wash Go",
    sections: [
      { title: "1. Общие положения", paragraphs: [
        "1.1. Настоящее Пользовательское соглашение («Соглашение») регулирует отношения между сервисом Wash Go («Сервис», «мы») и любым лицом, использующим сайт washgo.online, мобильное приложение или Telegram-бот/Mini App Wash Go («Пользователь», «вы»).",
        "1.2. Сервис предоставляет платформу для заказа выездной мойки автомобиля: Пользователь оформляет заявку через сайт, приложение или Telegram, а независимый исполнитель («мойщик») выполняет мойку по указанному адресу.",
        "1.3. Регистрация и использование Сервиса означает полное согласие с условиями настоящего Соглашения и Политики конфиденциальности.",
      ]},
      { title: "2. Регистрация и аккаунт", paragraphs: [
        "2.1. Регистрация производится по номеру мобильного телефона с подтверждением через SMS-код.",
        "2.2. Пользователь обязуется указывать достоверные данные (имя, номер телефона, адрес) и несёт ответственность за их актуальность.",
        "2.3. Доступ к аккаунту защищён паролем; Пользователь самостоятельно отвечает за сохранность данных для входа и за любые действия, совершённые через его аккаунт.",
      ]},
      { title: "3. Заказ и оплата", paragraphs: [
        "3.1. Заказ считается оформленным после выбора услуги, адреса, способа оплаты и подтверждения в приложении, на сайте или в Telegram-боте.",
        "3.2. Доступные способы оплаты: банковская карта (Humo/Uzcard), перевод на Click/Payme, наличными мойщику по завершении мойки.",
        "3.3. При оплате переводом Пользователь прикладывает скриншот/фото квитанции о переводе. Оплата считается подтверждённой только после проверки администратором Сервиса — до этого момента мойщик не обязан приступать к выполнению заказа.",
        "3.4. Если администратор отклоняет платёж (квитанция не соответствует сумме или реквизитам), Пользователю необходимо повторно подтвердить оплату или выбрать другой способ.",
        "3.5. Цены на услуги указаны в приложении на момент заказа и могут изменяться Сервисом в одностороннем порядке для новых заказов.",
      ]},
      { title: "4. Выполнение услуги и ответственность", paragraphs: [
        "4.1. Мойщик фиксирует состояние автомобиля фотографиями до и после мойки — это служит основанием для рассмотрения претензий по качеству или возможному ущербу.",
        "4.2. Претензии по качеству услуги или повреждению имущества принимаются в течение 24 часов после завершения заказа через поддержку Сервиса.",
        "4.3. Сервис выступает технологической платформой, связывающей Пользователя и мойщика; мойщики могут быть как штатными исполнителями, так и независимыми партнёрами Сервиса.",
        "4.4. Сервис не несёт ответственности за обстоятельства, находящиеся вне его контроля (плохие погодные условия, недоступность адреса, форс-мажор).",
      ]},
      { title: "5. Отмена заказа", paragraphs: [
        "5.1. Пользователь может отменить заказ до начала мойки (статус «принят» или «мойщик в пути») через приложение.",
        "5.2. Если оплата уже подтверждена администратором, а Пользователь отменяет заказ, возврат средств производится по обращению в поддержку.",
      ]},
      { title: "6. Подписки", paragraphs: [
        "6.1. Подписка предоставляет фиксированное количество моек в месяц по сниженной цене.",
        "6.2. Неиспользованные мойки сгорают в конце расчётного периода, если иное не указано в условиях конкретного тарифа.",
        "6.3. Подписку можно отменить в любой момент в настройках аккаунта; отмена действует с начала следующего расчётного периода.",
      ]},
      { title: "7. Изменение условий", paragraphs: [
        "7.1. Сервис может изменять настоящее Соглашение в любое время; новая редакция публикуется на этой странице. Продолжение использования Сервиса после изменений означает согласие с новой редакцией.",
      ]},
      { title: "8. Заключительные положения", paragraphs: [
        "8.1. Соглашение регулируется законодательством Республики Узбекистан.",
        "8.2. По всем вопросам, связанным с настоящим Соглашением, обращайтесь через раздел поддержки в приложении или Telegram-бот Wash Go.",
      ]},
    ],
  },
  en: {
    heading: "Terms of Service",
    subheading: "Public offer · effective from the moment you register with Wash Go",
    sections: [
      { title: "1. General Provisions", paragraphs: [
        "1.1. This User Agreement (\"Agreement\") governs the relationship between the Wash Go service (\"Service\", \"we\") and any person using the washgo.online website, mobile app, or Wash Go's Telegram bot/Mini App (\"User\", \"you\").",
        "1.2. The Service provides a platform for ordering an on-site car wash: the User places a request through the website, app, or Telegram, and an independent provider (\"worker\") performs the wash at the specified address.",
        "1.3. Registering and using the Service means full agreement with the terms of this Agreement and the Privacy Policy.",
      ]},
      { title: "2. Registration and Account", paragraphs: [
        "2.1. Registration is done by mobile phone number with SMS code confirmation.",
        "2.2. The User agrees to provide accurate information (name, phone number, address) and is responsible for keeping it up to date.",
        "2.3. Account access is protected by a password; the User is solely responsible for keeping login credentials safe and for any actions taken through their account.",
      ]},
      { title: "3. Order and Payment", paragraphs: [
        "3.1. An order is considered placed after selecting the service, address, payment method, and confirming it in the app, website, or Telegram bot.",
        "3.2. Available payment methods: bank card (Humo/Uzcard), transfer to Click/Payme, cash to the worker upon completion of the wash.",
        "3.3. When paying by transfer, the User attaches a screenshot/photo of the payment receipt. Payment is considered confirmed only after verification by the Service's administrator — until then, the worker is not obligated to start the order.",
        "3.4. If the administrator rejects the payment (the receipt doesn't match the amount or payment details), the User needs to re-confirm payment or choose another method.",
        "3.5. Service prices are shown in the app at the time of ordering and may be changed by the Service unilaterally for new orders.",
      ]},
      { title: "4. Service Performance and Liability", paragraphs: [
        "4.1. The worker records the car's condition with photos before and after the wash — this serves as the basis for reviewing complaints about quality or possible damage.",
        "4.2. Complaints about service quality or property damage are accepted within 24 hours after order completion through the Service's support.",
        "4.3. The Service acts as a technology platform connecting the User and the worker; workers may be either staff or independent partners of the Service.",
        "4.4. The Service is not liable for circumstances beyond its control (severe weather, inaccessible address, force majeure).",
      ]},
      { title: "5. Order Cancellation", paragraphs: [
        "5.1. The User may cancel an order before the wash begins (status \"accepted\" or \"worker en route\") through the app.",
        "5.2. If payment has already been confirmed by the administrator and the User cancels the order, a refund is processed upon request to support.",
      ]},
      { title: "6. Subscriptions", paragraphs: [
        "6.1. A subscription provides a fixed number of washes per month at a reduced price.",
        "6.2. Unused washes expire at the end of the billing period unless otherwise stated in the specific plan's terms.",
        "6.3. A subscription can be cancelled at any time in account settings; cancellation takes effect from the start of the next billing period.",
      ]},
      { title: "7. Changes to the Terms", paragraphs: [
        "7.1. The Service may change this Agreement at any time; the new version is published on this page. Continued use of the Service after changes means acceptance of the new version.",
      ]},
      { title: "8. Final Provisions", paragraphs: [
        "8.1. This Agreement is governed by the laws of the Republic of Uzbekistan.",
        "8.2. For any questions related to this Agreement, contact us through the support section in the app or the Wash Go Telegram bot.",
      ]},
    ],
  },
  uz: {
    heading: "Foydalanuvchi shartnomasi",
    subheading: "Ommaviy oferta · Wash Go'da ro'yxatdan o'tgan paytdan kuchga kiradi",
    sections: [
      { title: "1. Umumiy qoidalar", paragraphs: [
        "1.1. Mazkur Foydalanuvchi shartnomasi (\"Shartnoma\") Wash Go xizmati (\"Xizmat\", \"biz\") va washgo.online veb-saytidan, mobil ilovadan yoki Wash Go Telegram bot/Mini App'idan foydalanuvchi har qanday shaxs (\"Foydalanuvchi\", \"siz\") orasidagi munosabatlarni tartibga soladi.",
        "1.2. Xizmat avtomobilni joyida yuvish uchun buyurtma berish platformasini taqdim etadi: Foydalanuvchi sayt, ilova yoki Telegram orqali buyurtma beradi, mustaqil ijrochi (\"yuvuvchi\") esa ko'rsatilgan manzilda yuvishni amalga oshiradi.",
        "1.3. Ro'yxatdan o'tish va Xizmatdan foydalanish mazkur Shartnoma va Maxfiylik siyosati shartlariga to'liq rozilik bildirishni anglatadi.",
      ]},
      { title: "2. Ro'yxatdan o'tish va hisob", paragraphs: [
        "2.1. Ro'yxatdan o'tish mobil telefon raqami orqali SMS-kod bilan tasdiqlash yo'li bilan amalga oshiriladi.",
        "2.2. Foydalanuvchi to'g'ri ma'lumotlarni (ism, telefon raqami, manzil) kiritishga va ularning dolzarbligi uchun javobgar bo'lishga rozilik bildiradi.",
        "2.3. Hisobga kirish parol bilan himoyalangan; Foydalanuvchi kirish ma'lumotlarining xavfsizligi va o'z hisobi orqali amalga oshirilgan har qanday harakatlar uchun mustaqil javobgardir.",
      ]},
      { title: "3. Buyurtma va to'lov", paragraphs: [
        "3.1. Buyurtma xizmat turi, manzil, to'lov usuli tanlangandan va ilova, sayt yoki Telegram botda tasdiqlangandan keyin rasmiylashtirilgan hisoblanadi.",
        "3.2. Mavjud to'lov usullari: bank kartasi (Humo/Uzcard), Click/Payme orqali o'tkazma, yuvish tugagandan keyin yuvuvchiga naqd pul.",
        "3.3. O'tkazma orqali to'lashda Foydalanuvchi to'lov chekining skrinshoti/rasmini biriktiradi. To'lov faqat Xizmat administratori tomonidan tekshirilgandan keyin tasdiqlangan hisoblanadi — bungacha yuvuvchi buyurtmani bajarishni boshlashga majbur emas.",
        "3.4. Agar administrator to'lovni rad etsa (chek summasi yoki rekvizitlariga to'g'ri kelmasa), Foydalanuvchi to'lovni qayta tasdiqlashi yoki boshqa usulni tanlashi kerak.",
        "3.5. Xizmat narxlari buyurtma berish vaqtida ilovada ko'rsatiladi va Xizmat tomonidan yangi buyurtmalar uchun bir tomonlama o'zgartirilishi mumkin.",
      ]},
      { title: "4. Xizmatni bajarish va javobgarlik", paragraphs: [
        "4.1. Yuvuvchi avtomobil holatini yuvishdan oldin va keyin suratga oladi — bu sifat yoki ehtimoliy zarar bo'yicha shikoyatlarni ko'rib chiqish uchun asos bo'lib xizmat qiladi.",
        "4.2. Xizmat sifati yoki mol-mulkka zarar yetkazilishi bo'yicha shikoyatlar buyurtma tugagandan keyin 24 soat ichida Xizmat qo'llab-quvvatlash xizmati orqali qabul qilinadi.",
        "4.3. Xizmat Foydalanuvchi va yuvuvchini bog'laydigan texnologik platforma sifatida ishlaydi; yuvuvchilar Xizmatning xodimlari yoki mustaqil hamkorlari bo'lishi mumkin.",
        "4.4. Xizmat o'z nazoratidan tashqaridagi holatlar (yomon ob-havo, manzilning mavjud emasligi, fors-major) uchun javobgar emas.",
      ]},
      { title: "5. Buyurtmani bekor qilish", paragraphs: [
        "5.1. Foydalanuvchi yuvish boshlanishidan oldin (\"qabul qilindi\" yoki \"yuvuvchi yo'lda\" holatida) buyurtmani ilova orqali bekor qilishi mumkin.",
        "5.2. Agar to'lov administrator tomonidan allaqachon tasdiqlangan bo'lsa va Foydalanuvchi buyurtmani bekor qilsa, pulni qaytarish qo'llab-quvvatlash xizmatiga murojaat orqali amalga oshiriladi.",
      ]},
      { title: "6. Obunalar", paragraphs: [
        "6.1. Obuna oyiga belgilangan miqdordagi yuvishni pasaytirilgan narxda taqdim etadi.",
        "6.2. Foydalanilmagan yuvishlar, agar tarifning shartlarida boshqacha ko'rsatilmagan bo'lsa, hisob-kitob davri oxirida bekor qilinadi.",
        "6.3. Obunani istalgan vaqtda hisob sozlamalarida bekor qilish mumkin; bekor qilish keyingi hisob-kitob davri boshidan kuchga kiradi.",
      ]},
      { title: "7. Shartlarni o'zgartirish", paragraphs: [
        "7.1. Xizmat mazkur Shartnomani istalgan vaqtda o'zgartirishi mumkin; yangi versiya shu sahifada e'lon qilinadi. O'zgarishlardan keyin Xizmatdan foydalanishni davom ettirish yangi versiyaga rozilik bildirishni anglatadi.",
      ]},
      { title: "8. Yakuniy qoidalar", paragraphs: [
        "8.1. Shartnoma O'zbekiston Respublikasi qonunchiligiga muvofiq tartibga solinadi.",
        "8.2. Mazkur Shartnoma bilan bog'liq barcha savollar bo'yicha ilovadagi qo'llab-quvvatlash bo'limi yoki Wash Go Telegram boti orqali murojaat qiling.",
      ]},
    ],
  },
};

export default function TermsPage() {
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
                {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
