const API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function tgSendMessage(chatId: number, text: string, replyMarkup?: unknown) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", reply_markup: replyMarkup }),
  });
}

export async function tgAnswerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`${API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function tgDownloadFile(fileId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API}/getFile?file_id=${fileId}`);
  const data = await res.json();
  const filePath = data.result.file_path;
  const fileRes = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`);
  return fileRes.arrayBuffer();
}

export async function tgSendPhotos(chatId: number, urls: string[], caption?: string) {
  const photos = urls.slice(0, 10);
  if (photos.length === 0) return;

  if (photos.length === 1) {
    await fetch(`${API}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: photos[0], caption, parse_mode: "HTML" }),
    });
    return;
  }

  const media = photos.map((url, i) => ({ type: "photo", media: url, ...(i === 0 && caption ? { caption, parse_mode: "HTML" } : {}) }));
  await fetch(`${API}/sendMediaGroup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, media }),
  });
}
