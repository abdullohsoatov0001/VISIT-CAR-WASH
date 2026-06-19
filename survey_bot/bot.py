#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VISIT Car Wash — Interview Bot v3
Новое:
  - /ask [вопрос] — спросить ИИ о собранных данных
  - Паттерны каждые 5 интервью (авто)
  - График цен после каждого интервью    
  - Авто-определение языка (русский/узбекский)
  - Команда команды: /addteam /removeteam /team /myid
  - /search [слово] — найти в интервью
  - Оценка качества интервью (X/15 вопросов)
"""

import os
import re
import json
import asyncio
import logging
import tempfile
import sqlite3
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "")
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")
_admin_raw     = os.getenv("ADMIN_IDS", "")
ADMIN_IDS      = [int(x.strip()) for x in _admin_raw.split(",") if x.strip()]

TARGET    = 50
DB_PATH   = Path(__file__).parent / "survey_data.db"
AI_MODEL  = "llama-3.3-70b-versatile"

logging.basicConfig(format="%(asctime)s %(levelname)-8s %(name)s: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

groq_client = Groq(api_key=GROQ_API_KEY)

# ─── Контекст бизнеса и маркетинга ──────────────────────────────────────────
BUSINESS_CONTEXT = """
Ты — главный стратег, маркетолог и бизнес-аналитик стартапа VISIT Car Wash.
Ты сочетаешь в себе:
• Алекс Хормози (оффер, монетизация, unit-экономика)
• Дэвид Огилви (копирайтинг, позиционирование, бренд)
• Пол Грэм (фокус на реальной боли, MVP, рост)
• Филип Котлер (сегментация, 4P, customer journey)
• Шон Эллис (growth hacking, виральность, PMF)

Ты знаешь всё о проекте и думаешь как основатель, маркетолог и инвестор одновременно.

━━━ ЧТО МЫ СТРОИМ ━━━
VISIT — премиальная мобильная автомойка. Модель "Uber для мойки машин".
Клиент открывает приложение → выбирает услугу → мастер приезжает домой или в офис.
Мы не просто моем машины. Мы продаём ВРЕМЯ и СПОКОЙСТВИЕ.
Настоящий продукт: "Твоя машина всегда чистая, ты не тратишь на это ни минуты."

━━━ РЫНОК И КОНТЕКСТ ━━━
Страна запуска: Узбекистан, первый город — Ташкент (4 млн+ человек).
Валюта: UZS (сум). 1 USD ≈ 12 700 UZS. 1 000 000 сум ≈ $79.
Платёжные системы: Click и Payme — самые популярные в Узбекистане.
Telegram — главный мессенджер, Instagram — главная соцсеть.
Автомобилизация быстро растёт. Chevrolet, Cobalt, Tracker, Equinox доминируют.
Культура: чистота машины — статус и уважение. "Грязная машина — стыдно."

━━━ КОНКУРЕНТЫ В ТАШКЕНТЕ ━━━
• Стационарные мойки: очереди 20-60 мин, нужно ехать, непредсказуемое качество
• Ручные мойщики у домов: без стандартов, нет доверия, наличка
• Мойка у дилеров/ТЦ: дорого, только при обслуживании
• Мобильных сервисов с приложением: НЕТ. Мы первые. Голубой океан.

━━━ НАШИ УСЛУГИ ━━━
• Стандартная мойка кузова — основной продукт, высокая частота
• Детейлинг / полировка / химчистка салона — высокий чек
• Подписка — предсказуемый доход, LTV, лояльность
• Экспресс — быстро и дёшево, вход новых клиентов
• Корпоративные клиенты (автопарки, офисы) — B2B

━━━ МАРКЕТИНГОВЫЕ ФРЕЙМВОРКИ ━━━
JOBS TO BE DONE — люди покупают не "мойку", а:
→ "Хочу чтобы машина была чистой без лишних движений"
→ "Хочу не думать об этом вообще" (подписка)
→ "Хочу выглядеть солидно перед встречей"
→ "Хочу сэкономить время которое трачу в очереди"

КАНАЛЫ: Instagram (визуал до/после), Telegram Mini App, TikTok (вирал),
сарафанное радио (в Узбекистане очень сильно), ЖК и бизнес-центры офлайн.

━━━ МЕТРИКИ ━━━
CAC, LTV, Churn, NPS, Frequency, Conversion первый→повторный заказ

━━━ ЦЕЛЬ ИНТЕРВЬЮ ━━━
1. Какие СЛОВА используют люди для боли? → копирайтинг
2. Что убедит попробовать первый раз? → оффер
3. Что заставит рассказать друзьям? → виральная механика
4. Кто идеальный первый клиент? → таргет рекламы
5. Сколько готовы платить? → ценообразование
"""

# ─── Вопросы ─────────────────────────────────────────────────────────────────
QUESTIONS = [
    "У вас есть машина? Какая марка, и сколько лет вы её используете?",
    "Как часто вы моете машину и где — на автомойке, дома, у дилера?",
    "Сколько времени уходит на поездку на мойку плюс ожидание в очереди?",
    "Что вас раздражает или не устраивает в обычных автомойках?",
    "Слышали о мобильной мойке, когда мастер сам приезжает к вам? Пробовали?",
    "Как вам идея: заказываешь через приложение, мастер приезжает домой или в офис — как Uber?",
    "Сколько готовы заплатить за стандартную мойку кузова с выездом?",
    "Интересует детейлинг или химчистка с выездом? За сколько?",
    "Хотели бы подписку — 2 мойки в месяц за фикс цену? Какая цена справедлива?",
    "Что важнее: цена, скорость, качество или удобство? Почему?",
    "Насколько доверяете незнакомым мастерам у вашей машины? Что нужно для доверия?",
    "Какие функции должны быть в приложении?",
    "Что лично для вас будет главным плюсом мобильной мойки?",
    "Что могло бы вас остановить от использования?",
    "Порекомендовали бы друзьям? Почему да или нет?",
]
QUESTIONS_TEXT = "\n".join(f"{i+1}. {q}" for i, q in enumerate(QUESTIONS))

# ─── База данных ──────────────────────────────────────────────────────────────
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS interviews (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                interviewer   INTEGER,
                participant   TEXT,
                transcription TEXT,
                extracted_qa  TEXT,
                analysis      TEXT,
                quality       INTEGER DEFAULT 0,
                created_at    TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS team_members (
                user_id    INTEGER PRIMARY KEY,
                username   TEXT,
                full_name  TEXT,
                added_at   TEXT
            )
        """)
        # Add quality column if missing (migration)
        try:
            conn.execute("ALTER TABLE interviews ADD COLUMN quality INTEGER DEFAULT 0")
        except Exception:
            pass
        conn.commit()


def save_interview(interviewer_id, participant, transcription, extracted_qa, analysis, quality):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO interviews VALUES (NULL,?,?,?,?,?,?,?)",
            (interviewer_id, participant, transcription,
             json.dumps(extracted_qa, ensure_ascii=False),
             analysis, quality, datetime.now().isoformat()),
        )
        conn.commit()


def count_interviews():
    with sqlite3.connect(DB_PATH) as conn:
        return conn.execute("SELECT COUNT(*) FROM interviews").fetchone()[0]


def get_all_interviews():
    with sqlite3.connect(DB_PATH) as conn:
        return conn.execute(
            "SELECT participant, extracted_qa, analysis FROM interviews ORDER BY created_at"
        ).fetchall()


def get_interviews_with_ids():
    with sqlite3.connect(DB_PATH) as conn:
        return conn.execute(
            "SELECT id, participant, quality, created_at FROM interviews ORDER BY created_at"
        ).fetchall()


def delete_interview(interview_id: int) -> bool:
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.execute("DELETE FROM interviews WHERE id=?", (interview_id,))
        conn.commit()
        return cur.rowcount > 0


def get_all_with_transcription():
    with sqlite3.connect(DB_PATH) as conn:
        return conn.execute(
            "SELECT participant, transcription, extracted_qa, analysis FROM interviews ORDER BY created_at"
        ).fetchall()


def add_team_member(user_id, username, full_name):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT OR REPLACE INTO team_members VALUES (?,?,?,?)",
            (user_id, username, full_name, datetime.now().isoformat()),
        )
        conn.commit()


def remove_team_member(user_id):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM team_members WHERE user_id=?", (user_id,))
        conn.commit()


def get_team_members():
    with sqlite3.connect(DB_PATH) as conn:
        return conn.execute(
            "SELECT user_id, username, full_name, added_at FROM team_members"
        ).fetchall()


def get_all_notify_ids():
    """Admins + team members."""
    team_ids = {row[0] for row in get_team_members()}
    return set(ADMIN_IDS) | team_ids


# ─── Утилиты ──────────────────────────────────────────────────────────────────
def is_admin(uid): return uid in ADMIN_IDS
def is_team(uid):  return uid in get_all_notify_ids()


def progress_bar(done):
    pct = min(100, int(done / TARGET * 100))
    filled = pct // 5
    return f"`{'█' * filled}{'░' * (20 - filled)}`  {done}/{TARGET}"


def quality_score(extracted_qa: dict) -> tuple:
    total = len(QUESTIONS)
    answered = sum(
        1 for v in extracted_qa.values()
        if v and "не упомянул" not in v.lower() and len(v) > 5
    )
    return answered, total


def parse_price_ksum(text: str):
    """Extract price in thousands of sums from answer text. Returns int or None."""
    if not text or "не упомянул" in text.lower():
        return None
    text = text.lower()
    m = re.search(r'(\d[\d\s]{2,5})', text)
    if m:
        try:
            n = int(m.group(1).replace(' ', ''))
            if n >= 10000:
                return n // 1000
            if 10 <= n <= 1000:
                return n
        except ValueError:
            pass
    m = re.search(r'(\d+)\s*[кk]', text)
    if m:
        return int(m.group(1))
    m = re.search(r'(\d+)', text)
    if m:
        n = int(m.group(1))
        if 10 <= n <= 1000:
            return n
    return None


def build_price_chart(all_data: list) -> str:
    prices = []
    for _, qa_json, _ in all_data:
        try:
            qa = json.loads(qa_json)
            p = parse_price_ksum(qa.get("7", ""))
            if p:
                prices.append(p)
        except Exception:
            pass
    if not prices:
        return ""

    buckets = [("до 30к", 0, 30), ("30–50к", 30, 50), ("50–80к", 50, 80),
               ("80–120к", 80, 120), ("120к+", 120, 9999)]
    lines = [f"💰 *Цены — стандартная мойка* ({len(prices)} чел.)"]
    for label, lo, hi in buckets:
        cnt = sum(1 for p in prices if lo <= p < hi)
        bar = "█" * cnt + "░" * max(0, 8 - cnt)
        lines.append(f"`{label:8}` {bar} {cnt}")
    med = sorted(prices)[len(prices) // 2]
    avg = sum(prices) / len(prices)
    lines.append(f"\nМедиана: *{med}к* · Среднее: *{avg:.0f}к* сум")
    return "\n".join(lines)


async def send_file(update: Update, content: str, filename: str, caption: str = ""):
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, encoding="utf-8"
    ) as f:
        f.write(content)
        tmp = f.name
    await update.message.reply_document(
        document=open(tmp, "rb"), filename=filename,
        caption=caption or filename
    )
    os.unlink(tmp)


async def send_long(update: Update, text: str):
    if len(text) <= 4000:
        await update.message.reply_text(text, parse_mode="Markdown")
    else:
        await send_file(update, text.replace("*","").replace("`",""), "result.txt")


async def notify_all(app, text: str, doc_path: str = None, doc_name: str = None):
    for uid in get_all_notify_ids():
        try:
            if doc_path:
                await app.bot.send_document(
                    chat_id=uid, document=open(doc_path, "rb"),
                    filename=doc_name, caption=text[:1000], parse_mode="Markdown"
                )
            else:
                await app.bot.send_message(chat_id=uid, text=text, parse_mode="Markdown")
        except Exception as e:
            logger.error("Notify %s: %s", uid, e)


# ─── Расшифровка (авто-язык) ─────────────────────────────────────────────────
async def transcribe(file_path: str) -> str:
    def _do():
        with open(file_path, "rb") as f:
            # Без language= → Whisper сам определяет (русский/узбекский/др.)
            r = groq_client.audio.transcriptions.create(
                file=(Path(file_path).name, f),
                model="whisper-large-v3",
            )
        return r.text.strip()
    return await asyncio.to_thread(_do)


# ─── ИИ-функции ──────────────────────────────────────────────────────────────
def _call_ai(system: str, user: str, max_tokens: int = 2000) -> str:
    resp = groq_client.chat.completions.create(
        model=AI_MODEL,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
    )
    return resp.choices[0].message.content.strip()


def _extract_and_analyze(participant: str, transcription: str) -> tuple:
    questions_block = "\n".join(f"{i+1}. {q}" for i, q in enumerate(QUESTIONS))
    raw = _call_ai(
        BUSINESS_CONTEXT,
        f"Расшифровка интервью — «{participant}».\n"
        f"Вопросы (заданы в произвольном порядке):\n{questions_block}\n\n"
        f"━━━ РАСШИФРОВКА ━━━\n{transcription}\n━━━━━━━━━━━━━━━━━━\n\n"
        f"Сделай ДВА блока:\n\n"
        f"## ОТВЕТЫ\n"
        f"Для каждого из 15 вопросов — что ответил человек.\n"
        f"Если не упомянул — «не упомянул».\n"
        f"Формат строго: 1. [ответ]\n2. [ответ]\n...\n\n"
        f"## АНАЛИЗ\n"
        f"👤 Портрет: кто этот человек, его Job-to-be-done\n"
        f"😤 Его главная боль: ДОСЛОВНО его словами\n"
        f"💰 Готовность платить: цифры в сумах\n"
        f"🎯 Маркетинговый инсайт: какой крючок зацепит именно его\n"
        f"📣 Его слова для рекламы: 1-2 фразы из его речи готовые для рекламы\n"
        f"⚠️ Барьеры и как снять: что остановит + решение от VISIT\n"
        f"🏆 Вывод для нас: что это меняет в стратегии/продукте/маркетинге\n\n"
        f"Цены в сумах. Думай как маркетолог. На русском.",
        max_tokens=2500,
    )

    extracted_qa = {}
    analysis = raw
    if "## ОТВЕТЫ" in raw and "## АНАЛИЗ" in raw:
        parts = raw.split("## АНАЛИЗ", 1)
        ans_block = parts[0].replace("## ОТВЕТЫ", "").strip()
        analysis = "## АНАЛИЗ\n" + parts[1].strip()
        for line in ans_block.splitlines():
            line = line.strip()
            if not line:
                continue
            for i in range(15, 0, -1):
                if line.startswith(f"{i}."):
                    extracted_qa[str(i)] = line[len(f"{i}."):].strip()
                    break
    return extracted_qa, analysis


def _analyze_patterns(all_data: list, count: int) -> str:
    blocks = [f"\n[{p}]\n{a}" for p, _, a in all_data]
    return _call_ai(
        BUSINESS_CONTEXT,
        f"Проанализировано {count} интервью VISIT.\n"
        f"{''.join(blocks)}\n\n"
        f"Выдели ПАТТЕРНЫ которые повторяются:\n\n"
        f"🔁 Что говорят почти все?\n"
        f"💰 Ценовой консенсус (в сумах)\n"
        f"😤 Главная боль (у скольких она есть?)\n"
        f"⚠️ Главный барьер\n"
        f"💡 Неожиданный инсайт\n"
        f"📈 Что нового по сравнению с предыдущими интервью?\n"
        f"✅ Вывод: подтверждается ли наша гипотеза?\n\n"
        f"Коротко и конкретно. На русском.",
        max_tokens=900,
    )


def _answer_question(all_data: list, question: str) -> str:
    blocks = []
    for participant, qa_json, _ in all_data:
        try:
            qa = json.loads(qa_json)
            answers = "\n".join(f"  Q{i}: {qa.get(str(i),'—')}" for i in range(1, 16))
            blocks.append(f"\n[{participant}]\n{answers}")
        except Exception:
            pass
    return _call_ai(
        BUSINESS_CONTEXT,
        f"Данные {len(all_data)} интервью VISIT:\n{''.join(blocks)}\n\n"
        f"Вопрос основателя: {question}\n\n"
        f"Ответь конкретно, ссылаясь на участников по имени. На русском.",
        max_tokens=800,
    )


def _final_analysis(all_data: list, count: int) -> str:
    blocks = []
    for participant, qa_json, analysis in all_data:
        blocks.append(f"\n=== {participant} ===")
        try:
            qa = json.loads(qa_json)
            for i, _ in enumerate(QUESTIONS, 1):
                blocks.append(f"Q{i}: {qa.get(str(i),'—')}")
        except Exception:
            blocks.append(analysis)
    return _call_ai(
        BUSINESS_CONTEXT,
        f"Проанализируй данные {count} интервью для VISIT.\n\n"
        f"{''.join(blocks)}\n\n"
        f"## 1. ПОРТРЕТ АУДИТОРИИ\n"
        f"## 2. КЛЮЧЕВЫЕ БОЛИ (топ-5 с цитатами)\n"
        f"## 3. ГОТОВНОСТЬ ПЛАТИТЬ (в сумах, диапазон + медиана)\n"
        f"## 4. СПРОС НА УСЛУГИ\n"
        f"## 5. БАРЬЕРЫ И КАК СНЯТЬ\n"
        f"## 6. MUST-HAVE ФИЧИ ПРИЛОЖЕНИЯ (топ-7)\n"
        f"## 7. УТП НА РЫНКЕ УЗБЕКИСТАНА\n"
        f"## 8. РЕКОМЕНДУЕМЫЕ ЦЕНЫ В СУМАХ\n"
        f"## 9. СТРАТЕГИЯ ЗАПУСКА В ТАШКЕНТЕ\n"
        f"## 10. ИТОГОВЫЙ ВЫВОД (PMF? запускаться?)\n\n"
        f"Цены в сумах. Цитаты из ответов. На русском.",
        max_tokens=4000,
    )


def _build_marketing_strategy(all_data: list, count: int) -> str:
    blocks = [f"\n[{p}]\n{a}" for p, _, a in all_data]
    return _call_ai(
        BUSINESS_CONTEXT,
        f"На основе {count} интервью создай МАРКЕТИНГОВУЮ СТРАТЕГИЮ VISIT.\n\n"
        f"{''.join(blocks)}\n\n"
        f"## 1. ЦЕЛЕВЫЕ СЕГМЕНТЫ (3 персоны с именем, возрастом, болью)\n"
        f"## 2. ПОЗИЦИОНИРОВАНИЕ: VISIT — это [ЧТО] для [КОГО]\n"
        f"## 3. КОПИРАЙТИНГ\n"
        f"   — Слоган (рус + узб)\n"
        f"   — 5 рекламных заголовков (из реальных слов интервью)\n"
        f"   — 3 CTA для первого заказа\n"
        f"   — Текст первого Instagram-поста\n"
        f"## 4. КАНАЛЫ: Instagram / Telegram / TikTok / офлайн / сарафан\n"
        f"## 5. ОФФЕР ДЛЯ ПЕРВОГО ЗАКАЗА (в сумах)\n"
        f"## 6. РЕФЕРАЛЬНАЯ ПРОГРАММА (механика + вознаграждение в сумах)\n"
        f"## 7. ЦЕНООБРАЗОВАНИЕ (все услуги в сумах + психология цены)\n"
        f"## 8. ПЛАН ПЕРВЫХ 30 ДНЕЙ (по неделям)\n"
        f"## 9. KPI ПЕРВОГО МЕСЯЦА (CAC, LTV, конверсия, NPS)\n"
        f"## 10. ТОП-3 БЫСТРЫХ ПОБЕДЫ ЗА 7 ДНЕЙ\n\n"
        f"Всё с цифрами в сумах. Реальные фразы из интервью. На русском.",
        max_tokens=5000,
    )


# ─── Обработчики ─────────────────────────────────────────────────────────────
async def cmd_start(update: Update, _context: ContextTypes.DEFAULT_TYPE):
    done = count_interviews()
    await update.message.reply_text(
        f"👋 *VISIT Car Wash — Interview Bot*\n\n"
        f"📊 {progress_bar(done)}\n\n"
        f"*Как пользоваться:*\n"
        f"1️⃣ /q — список вопросов для интервью\n"
        f"2️⃣ Идёшь к человеку, записываешь голосовой\n"
        f"3️⃣ Пишешь имя → отправляешь голосовой\n"
        f"4️⃣ Получаешь расшифровку + анализ\n\n"
        f"/myid — узнать свой ID (для добавления в команду)",
        parse_mode="Markdown",
    )


async def cmd_questions(update: Update, _context: ContextTypes.DEFAULT_TYPE):
    done = count_interviews()
    await update.message.reply_text(
        f"📋 *15 вопросов для интервью VISIT*\n\n"
        f"{QUESTIONS_TEXT}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📊 {progress_bar(done)}\n\n"
        f"Запиши голосовой и отправь сюда 🎙",
        parse_mode="Markdown",
    )


async def cmd_myid(update: Update, _context: ContextTypes.DEFAULT_TYPE):
    u = update.effective_user
    await update.message.reply_text(
        f"👤 Твой Telegram ID: `{u.id}`\n"
        f"Имя: {u.full_name}\n\n"
        f"Отправь этот ID администратору — он добавит тебя в команду.",
        parse_mode="Markdown",
    )


async def cmd_progress(update: Update, _context: ContextTypes.DEFAULT_TYPE):
    done = count_interviews()
    await update.message.reply_text(
        f"📊 *Прогресс VISIT*\n\n{progress_bar(done)}\n\n"
        f"{'🏆 Цель достигнута!' if done >= TARGET else f'Осталось: {TARGET-done} интервью'}",
        parse_mode="Markdown",
    )


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    name = update.message.text.strip()
    if name.startswith("/"):
        return
    context.user_data["next_name"] = name
    await update.message.reply_text(
        f"✅ Имя: *{name}*\nТеперь отправь голосовое 🎙",
        parse_mode="Markdown",
    )


async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    file_obj = msg.voice or msg.audio
    done = count_interviews()
    participant = context.user_data.pop("next_name", f"Участник #{done + 1}")

    # 1. Скачать и расшифровать
    status = await msg.reply_text(
        f"🎙 Расшифровываю «*{participant}*»…\n_(авто-определение языка)_",
        parse_mode="Markdown",
    )
    tg_file = await file_obj.get_file()
    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
        await tg_file.download_to_drive(tmp.name)
        tmp_path = tmp.name
    try:
        transcription = await transcribe(tmp_path)
    except Exception as e:
        await status.edit_text(f"❌ Ошибка расшифровки: {e}")
        return
    finally:
        os.unlink(tmp_path)

    await status.edit_text(
        f"✅ Расшифровано ({len(transcription)} символов)\n🤖 Анализирую…"
    )

    # 2. ИИ: извлечь ответы + анализ
    try:
        extracted_qa, analysis = await asyncio.to_thread(
            _extract_and_analyze, participant, transcription
        )
    except Exception as e:
        await status.edit_text(f"❌ Ошибка анализа: {e}")
        return

    # 3. Оценка качества
    answered, total = quality_score(extracted_qa)
    quality_pct = int(answered / total * 100)
    quality_line = (
        f"{'🟢' if quality_pct >= 80 else '🟡' if quality_pct >= 50 else '🔴'} "
        f"Качество интервью: *{answered}/{total}* вопросов покрыто ({quality_pct}%)"
    )

    # 4. Сохранить
    save_interview(
        update.effective_user.id, participant, transcription,
        extracted_qa, analysis, answered,
    )
    done = count_interviews()

    # 5. Расшифровка
    await status.delete()
    if len(transcription) <= 3500:
        await msg.reply_text(
            f"📝 *Расшифровка — {participant}:*\n\n_{transcription}_",
            parse_mode="Markdown",
        )
    else:
        await send_file(msg, transcription, f"transcript_{participant}.txt",
                        f"📝 Расшифровка — {participant}")

    # 6. Ответы по вопросам
    if extracted_qa:
        qa_lines = []
        for i, q in enumerate(QUESTIONS, 1):
            ans = extracted_qa.get(str(i), "—")
            qa_lines.append(f"*{i}. {q[:55]}*\n➜ {ans}\n")
        qa_text = f"📋 *Ответы — {participant}*\n\n" + "\n".join(qa_lines)
        await send_long(update, qa_text)

    # 7. Анализ + качество
    analysis_msg = (
        f"🧠 *Анализ — {participant}*\n\n{analysis}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"{quality_line}\n"
        f"📊 {progress_bar(done)}"
    )
    await send_long(update, analysis_msg)

    # 8. График цен
    all_data = get_all_interviews()
    chart = build_price_chart(all_data)
    if chart:
        await msg.reply_text(chart, parse_mode="Markdown")

    # 9. Паттерны каждые 5 интервью
    if done % 5 == 0 and done > 0:
        await msg.reply_text(f"🔍 *Паттерны после {done} интервью — генерирую…*", parse_mode="Markdown")
        try:
            patterns = await asyncio.to_thread(_analyze_patterns, all_data, done)
            pattern_msg = f"📈 *Паттерны VISIT после {done} интервью:*\n\n{patterns}"
            await notify_all(context.application, pattern_msg)
        except Exception as e:
            logger.error("Patterns error: %s", e)

    # 10. Уведомить команду
    notify_text = (
        f"📥 Новое интервью: *{participant}* ({quality_line.split(':')[1].strip()})\n"
        f"📊 {progress_bar(done)}\n\n{analysis[:400]}…"
    )
    for uid in get_all_notify_ids():
        if uid != update.effective_user.id:
            try:
                await context.application.bot.send_message(
                    chat_id=uid, text=notify_text, parse_mode="Markdown"
                )
            except Exception:
                pass

    # 11. Финальный анализ на 50-м
    if done >= TARGET:
        await msg.reply_text("🏆 *50 интервью! Генерирую финальный анализ…*", parse_mode="Markdown")
        final = await asyncio.to_thread(_final_analysis, all_data, done)
        stamp = datetime.now().strftime("%Y%m%d_%H%M")
        content = f"ФИНАЛЬНЫЙ АНАЛИЗ VISIT\n{datetime.now()}\n{done} интервью\n\n{final}"
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False, encoding="utf-8") as f:
            f.write(content)
            tmp = f.name
        await notify_all(
            context.application,
            f"🏆 Финальный анализ {done} интервью готов!",
            doc_path=tmp, doc_name=f"VISIT_final_{stamp}.txt",
        )
        os.unlink(tmp)


# ─── Команды для команды ─────────────────────────────────────────────────────
async def cmd_ask(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_team(update.effective_user.id):
        await update.message.reply_text("⛔ Нет доступа.")
        return
    question = " ".join(context.args).strip()
    if not question:
        await update.message.reply_text(
            "Использование: /ask [вопрос]\n"
            "Пример: /ask кто готов платить больше 100к сум?"
        )
        return
    all_data = get_all_interviews()
    if not all_data:
        await update.message.reply_text("Пока нет интервью.")
        return
    await update.message.reply_text(f"🤔 Ищу ответ на: _{question}_…", parse_mode="Markdown")
    try:
        answer = await asyncio.to_thread(_answer_question, all_data, question)
        await send_long(update, f"❓ *{question}*\n\n{answer}")
    except Exception as e:
        await update.message.reply_text(f"❌ Ошибка: {e}")


async def cmd_search(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_team(update.effective_user.id):
        await update.message.reply_text("⛔ Нет доступа.")
        return
    keyword = " ".join(context.args).strip().lower()
    if not keyword:
        await update.message.reply_text(
            "Использование: /search [слово]\nПример: /search очередь"
        )
        return
    all_data = get_all_with_transcription()
    results = []
    for participant, transcription, _, _ in all_data:
        if keyword in transcription.lower():
            # Найти предложение с ключевым словом
            for sent in re.split(r'[.!?]', transcription):
                if keyword in sent.lower() and len(sent.strip()) > 10:
                    results.append(f"👤 *{participant}:*\n_{sent.strip()}_")
                    break
    if results:
        text = f"🔍 «{keyword}» — найдено в *{len(results)}* интервью:\n\n" + "\n\n".join(results)
    else:
        text = f"🔍 «{keyword}» не найдено ни в одном интервью."
    await send_long(update, text)


# ─── Команды только для админов ──────────────────────────────────────────────
async def cmd_stats(update: Update, _context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        return
    done = count_interviews()
    with sqlite3.connect(DB_PATH) as conn:
        avg_q = conn.execute("SELECT AVG(quality) FROM interviews").fetchone()[0] or 0
    await update.message.reply_text(
        f"📊 *Статистика VISIT*\n\n"
        f"🎯 Цель: {TARGET} интервью\n"
        f"✅ Собрано: {done}\n"
        f"📋 Среднее качество: {avg_q:.1f}/15 вопросов\n\n"
        f"{progress_bar(done)}\n\n"
        f"{'🏆 ЦЕЛЬ ДОСТИГНУТА!' if done >= TARGET else f'Осталось: {TARGET - done}'}",
        parse_mode="Markdown",
    )


async def cmd_summary(update: Update, _context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        return
    all_data = get_all_interviews()
    if not all_data:
        await update.message.reply_text("Нет интервью.")
        return
    await update.message.reply_text(f"🤖 Генерирую анализ {len(all_data)} интервью… (~30 сек)")
    try:
        final = await asyncio.to_thread(_final_analysis, all_data, len(all_data))
        stamp = datetime.now().strftime("%Y%m%d_%H%M")
        await send_file(
            update,
            f"АНАЛИЗ VISIT ({len(all_data)} интервью)\n{datetime.now()}\n\n{final}",
            f"VISIT_analysis_{stamp}.txt",
            f"📊 Анализ {len(all_data)} интервью",
        )
    except Exception as e:
        await update.message.reply_text(f"❌ {e}")


async def cmd_marketing(update: Update, _context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        return
    all_data = get_all_interviews()
    if not all_data:
        await update.message.reply_text("Нет интервью.")
        return
    await update.message.reply_text(
        f"🎯 Генерирую маркетинговую стратегию по {len(all_data)} интервью… (~1 мин)"
    )
    try:
        strategy = await asyncio.to_thread(_build_marketing_strategy, all_data, len(all_data))
        stamp = datetime.now().strftime("%Y%m%d_%H%M")
        await send_file(
            update,
            f"МАРКЕТИНГОВАЯ СТРАТЕГИЯ VISIT\n{datetime.now()}\n\n{strategy}",
            f"VISIT_marketing_{stamp}.txt",
            f"🎯 Маркетинг ({len(all_data)} интервью)",
        )
    except Exception as e:
        await update.message.reply_text(f"❌ {e}")


async def cmd_export(update: Update, _context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        return
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            "SELECT participant, extracted_qa, quality, created_at FROM interviews ORDER BY created_at"
        ).fetchall()
    if not rows:
        await update.message.reply_text("Нет данных.")
        return
    header = "participant\tquality\t" + "\t".join(f"Q{i}" for i in range(1, 16)) + "\tdate"
    lines = [header]
    for participant, qa_json, quality, created_at in rows:
        try:
            qa = json.loads(qa_json)
        except Exception:
            qa = {}
        answers = [qa.get(str(i), "") for i in range(1, 16)]
        row = [participant, str(quality)] + answers + [created_at[:10]]
        lines.append("\t".join(f'"{c}"' for c in row))
    stamp = datetime.now().strftime("%Y%m%d_%H%M")
    await send_file(update, "\n".join(lines), f"interviews_{stamp}.tsv",
                    f"📎 {len(rows)} интервью")


async def cmd_list(update: Update, _context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        return
    rows = get_interviews_with_ids()
    if not rows:
        await update.message.reply_text("Нет данных.")
        return
    lines = []
    for db_id, participant, quality, created_at in rows:
        date = created_at[:10]
        lines.append(f"#{db_id} — {participant} ({quality}/15) [{date}]")
    text = f"👥 *Список интервью ({len(rows)}/{TARGET}):*\n\n" + "\n".join(lines)
    text += "\n\n🗑 Удалить: /delete [номер]"
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_delete(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        return
    args = context.args
    if not args or not args[0].isdigit():
        await update.message.reply_text(
            "Использование: /delete [номер]\n"
            "Номера смотри в /list\n"
            "Пример: /delete 3"
        )
        return
    interview_id = int(args[0])
    rows = get_interviews_with_ids()
    target = next((r for r in rows if r[0] == interview_id), None)
    if not target:
        await update.message.reply_text(f"❌ Интервью #{interview_id} не найдено.")
        return
    participant = target[1]
    deleted = delete_interview(interview_id)
    if deleted:
        done = count_interviews()
        await update.message.reply_text(
            f"🗑 Интервью *#{interview_id} — {participant}* удалено.\n"
            f"📊 {progress_bar(done)}",
            parse_mode="Markdown",
        )
    else:
        await update.message.reply_text("❌ Не удалось удалить.")


# ─── Управление командой ──────────────────────────────────────────────────────
async def cmd_team(update: Update, _context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        return
    members = get_team_members()
    admin_lines = [f"👑 {uid} (admin)" for uid in ADMIN_IDS]
    team_lines = [
        f"👤 *{fn}* (@{un}) — ID: `{uid}`"
        for uid, un, fn, _ in members
        if uid not in ADMIN_IDS
    ]
    text = (
        f"👥 *Команда VISIT*\n\n"
        f"Админы:\n" + "\n".join(admin_lines) +
        (f"\n\nИнтервьюеры:\n" + "\n".join(team_lines) if team_lines else "\n\nИнтервьюеры: пусто") +
        f"\n\n➕ Добавить: /addteam [ID] [имя]\n"
        f"❌ Удалить: /removeteam [ID]\n"
        f"🔍 Найти ID: /myid"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_addteam(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        return
    args = context.args
    if not args or not args[0].isdigit():
        await update.message.reply_text("Использование: /addteam [user_id] [имя]\nПример: /addteam 123456789 Санжар")
        return
    uid = int(args[0])
    name = " ".join(args[1:]) if len(args) > 1 else f"User {uid}"
    add_team_member(uid, "", name)
    await update.message.reply_text(
        f"✅ *{name}* (ID: `{uid}`) добавлен в команду VISIT.\n"
        f"Теперь он может использовать /ask и /search.",
        parse_mode="Markdown",
    )


async def cmd_removeteam(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_admin(update.effective_user.id):
        return
    args = context.args
    if not args or not args[0].isdigit():
        await update.message.reply_text("Использование: /removeteam [user_id]")
        return
    uid = int(args[0])
    remove_team_member(uid)
    await update.message.reply_text(f"✅ Пользователь `{uid}` удалён из команды.", parse_mode="Markdown")


# ─── Запуск ───────────────────────────────────────────────────────────────────
def main():
    if not TELEGRAM_TOKEN:
        raise ValueError("TELEGRAM_TOKEN не задан в .env")
    init_db()
    logger.info("DB: %s  Admins: %s  Target: %d", DB_PATH, ADMIN_IDS, TARGET)

    app = Application.builder().token(TELEGRAM_TOKEN).build()

    # Все
    app.add_handler(CommandHandler("start",      cmd_start))
    app.add_handler(CommandHandler("q",          cmd_questions))
    app.add_handler(CommandHandler("myid",       cmd_myid))
    app.add_handler(CommandHandler("progress",   cmd_progress))

    # Команда (интервьюеры + админы)
    app.add_handler(CommandHandler("ask",        cmd_ask))
    app.add_handler(CommandHandler("search",     cmd_search))

    # Только админы
    app.add_handler(CommandHandler("stats",      cmd_stats))
    app.add_handler(CommandHandler("summary",    cmd_summary))
    app.add_handler(CommandHandler("marketing",  cmd_marketing))
    app.add_handler(CommandHandler("export",     cmd_export))
    app.add_handler(CommandHandler("list",       cmd_list))
    app.add_handler(CommandHandler("delete",     cmd_delete))
    app.add_handler(CommandHandler("team",       cmd_team))
    app.add_handler(CommandHandler("addteam",    cmd_addteam))
    app.add_handler(CommandHandler("removeteam", cmd_removeteam))

    # Сообщения
    app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, handle_voice))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    logger.info("Bot polling…")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
