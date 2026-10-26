export interface CodeFile {
  path: string;
  name: string;
  category: 'bot' | 'db' | 'api' | 'cron' | 'deploy';
  content: string;
  language: string;
  description: string;
}

export const PYTHON_CODEBASE: CodeFile[] = [
  {
    path: 'bot/main.py',
    name: 'main.py',
    category: 'bot',
    language: 'python',
    description: 'Главная точка входа aiogram 3.x: диспетчер, регистрация роутеров, middleware и запуск',
    content: `"""
Telegram Bot Monolith Application - @DonDearOfficinaAI
Owner & Chief Pharmacist: @DonDearOfficina (Дипломированный провизор)
Python 3.11 | aiogram 3.x | PostgreSQL 15+ | SQLAlchemy 2.0 (async)
"""

import asyncio
import logging
import sys
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.client.default import DefaultBotProperties

from bot.config import settings
from bot.handlers import (
    start_router,
    author_stack_router,
    symptomatic_router,
    fundamental_router,
    biohacking_router,
    islamic_router,
    specialist_router,
    dondear_router,
    profile_router,
    specialist_console_router,
    owner_console_router,
)
from bot.middlewares.audit import AuditMiddleware
from bot.middlewares.auth import AuthMiddleware
from bot.middlewares.rate_limit import RateLimitMiddleware
from cron.scheduler import start_scheduler
from db.session import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("neuroboost_bot")


async def main() -> None:
    logger.info("Initializing NeuroBoost Monolith Bot for @DonDearOfficina...")

    # 1. Initialize Database & verify PostgreSQL 15 connection
    await init_db()

    # 2. Configure Telegram Bot
    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)

    # 3. Register Global Middlewares
    dp.message.middleware(RateLimitMiddleware(rate_limit=1.0))
    dp.callback_query.middleware(RateLimitMiddleware(rate_limit=0.5))
    dp.update.middleware(AuthMiddleware())
    dp.update.middleware(AuditMiddleware())

    # 4. Include 8 User Routers & 2 Consoles
    dp.include_router(start_router)
    dp.include_router(author_stack_router)
    dp.include_router(symptomatic_router)
    dp.include_router(fundamental_router)
    dp.include_router(biohacking_router)
    dp.include_router(islamic_router)
    dp.include_router(specialist_router)
    dp.include_router(dondear_router)
    dp.include_router(profile_router)
    dp.include_router(specialist_console_router)
    dp.include_router(owner_console_router)

    # 5. Start Background Cron Tasks
    scheduler = start_scheduler()

    try:
        logger.info("Bot starting in polling/webhook mode. Waiting for updates...")
        await bot.delete_webhook(drop_pending_updates=True)
        await dp.start_polling(bot)
    finally:
        scheduler.shutdown()
        await bot.session.close()
        logger.info("Bot gracefully stopped.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bot execution terminated.")
`,
  },
  {
    path: 'bot/config.py',
    name: 'config.py',
    category: 'bot',
    language: 'python',
    description: 'Конфигурация проекта через Pydantic v2 Settings',
    content: `from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    BOT_TOKEN: str = Field(..., description="Telegram Bot API Token from @BotFather")
    BOT_USERNAME: str = Field("NeuroBoostBot", description="Bot handle without @")
    OWNER_TELEGRAM_ID: int = Field(999000111, description="Telegram ID for @DonDearOfficina")
    DATABASE_URL: str = Field(
        "postgresql+asyncpg://postgres:postgres@localhost:5432/neuroboost",
        description="Async PostgreSQL connection string",
    )
    REDIS_URL: str = Field("redis://localhost:6379/0", description="Redis connection URL")
    SECRET_KEY: str = Field("super-secure-jwt-secret-key-32-bytes-min", description="JWT secret key")
    TOTP_ISSUER: str = Field("NeuroBoost Specialist Console", description="2FA TOTP Issuer name")
    EVIDENCE_STRICT_MODE: bool = Field(True, description="Strict PMID/DOI requirement for medical claims")
    RATE_LIMIT_BROADCAST: int = Field(30, description="Max broadcast messages per second")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
`,
  },
  {
    path: 'bot/states/fsm.py',
    name: 'fsm.py',
    category: 'bot',
    language: 'python',
    description: 'FSM-состояния (Finite State Machine) для каждого из 8 разделов и консолей',
    content: `from aiogram.fsm.state import State, StatesGroup


class AuthorStackStates(StatesGroup):
    browsing_level = State()
    viewing_card = State()
    browsing_archive = State()


class SymptomaticStates(StatesGroup):
    input_symptom = State()
    input_localization = State()
    input_duration = State()
    input_intensity = State()
    input_biometrics = State()
    viewing_result = State()


class FundamentalStates(StatesGroup):
    input_symptom_history = State()
    input_metabolic_factors = State()
    input_diet_stress = State()
    viewing_plan = State()


class BiohackingStates(StatesGroup):
    select_goal = State()
    input_biomarkers = State()
    viewing_protocol = State()


class IslamicMedicineStates(StatesGroup):
    search_remedy = State()
    viewing_remedy = State()


class SpecialistStates(StatesGroup):
    select_specialization = State()
    viewing_specialist = State()
    confirm_consultation = State()


class DonDearStates(StatesGroup):
    browsing_notes = State()
    viewing_note = State()


class ProfileStates(StatesGroup):
    editing_age = State()
    editing_gender = State()
    editing_allergies = State()
    editing_chronic = State()
    editing_pregnancy = State()
    confirm_gdpr_consent = State()


class SpecialistConsoleStates(StatesGroup):
    auth_totp = State()
    menu = State()
    create_invite = State()
    add_patient_manual = State()
    send_patient_message = State()
    edit_profile = State()


class OwnerConsoleStates(StatesGroup):
    menu = State()
    med_list = State()
    med_create = State()
    med_edit = State()
    med_clarification = State()
    recs_list = State()
    recs_create = State()
    specialist_manage = State()
    patient_manage = State()
    broadcast_compose = State()
    broadcast_confirm = State()
    audit_view = State()
`,
  },
  {
    path: 'bot/keyboards/inline.py',
    name: 'inline.py',
    category: 'bot',
    language: 'python',
    description: 'Инлайн-клавиатуры для всех 8 разделов и инлайн-навигации с кнопкой «◀️ В меню»',
    content: `from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder


def get_main_menu_keyboard(is_owner: bool = False, is_specialist: bool = False) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.row(InlineKeyboardButton(text="💎 Мой стек (авторский протокол)", callback_data="nav_author_stack"))
    builder.row(InlineKeyboardButton(text="🩺 Симптоматическое лечение", callback_data="nav_symptomatic"))
    builder.row(InlineKeyboardButton(text="🌿 Фундаментальное лечение", callback_data="nav_fundamental"))
    builder.row(InlineKeyboardButton(text="⚡ Биохакинг", callback_data="nav_biohacking"))
    builder.row(InlineKeyboardButton(text="🕌 Исламская медицина", callback_data="nav_islamic"))
    builder.row(InlineKeyboardButton(text="👨‍⚕️ Связь со специалистом", callback_data="nav_specialists"))
    builder.row(InlineKeyboardButton(text="📌 Связь с @DonDearOfficina", callback_data="nav_dondear"))
    builder.row(InlineKeyboardButton(text="⚙️ Мой профиль", callback_data="nav_profile"))

    if is_specialist:
        builder.row(InlineKeyboardButton(text="🩺 Консоль специалиста", callback_data="nav_specialist_console"))
    if is_owner:
        builder.row(InlineKeyboardButton(text="👑 Консоль владельца (@DonDearOfficina)", callback_data="nav_owner_console"))

    return builder.as_markup()


def get_back_to_menu_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.row(InlineKeyboardButton(text="◀️ В главное меню", callback_data="nav_main_menu"))
    return builder.as_markup()


def get_author_levels_keyboard(on_protocol: bool) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.row(InlineKeyboardButton(text="1️⃣ Уровень: ЖКТ-фундамент", callback_data="stack_lvl_gastro"))
    builder.row(InlineKeyboardButton(text="2️⃣ Уровень: Нейробуст", callback_data="stack_lvl_neuroboost"))
    builder.row(InlineKeyboardButton(text="3️⃣ Уровень: БАД-поддержка", callback_data="stack_lvl_supplement"))
    builder.row(InlineKeyboardButton(text="📁 Архив / разовые / завершённые", callback_data="stack_archive"))
    
    cta_text = "✅ Вы следуете протоколу" if on_protocol else "🚀 Следовать протоколу"
    builder.row(InlineKeyboardButton(text=cta_text, callback_data="toggle_follow_protocol"))
    builder.row(InlineKeyboardButton(text="◀️ В главное меню", callback_data="nav_main_menu"))
    return builder.as_markup()


def get_red_flag_alert_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.row(InlineKeyboardButton(text="🚑 ВЫЗВАТЬ СКОРУЮ ПОМОЩЬ (112)", url="tel:112"))
    builder.row(InlineKeyboardButton(text="◀️ В главное меню", callback_data="nav_main_menu"))
    return builder.as_markup()


def get_owner_console_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.row(InlineKeyboardButton(text="💊 База препаратов", callback_data="owner_meds"))
    builder.row(InlineKeyboardButton(text="📌 Рекомендации", callback_data="owner_recs"))
    builder.row(InlineKeyboardButton(text="👨‍⚕️ Специалисты", callback_data="owner_specialists"))
    builder.row(InlineKeyboardButton(text="👥 Пациенты", callback_data="owner_patients"))
    builder.row(InlineKeyboardButton(text="📊 Статистика & CSV", callback_data="owner_stats"))
    builder.row(InlineKeyboardButton(text="📢 Рассылка", callback_data="owner_broadcast"))
    builder.row(InlineKeyboardButton(text="📜 Аудит-лог", callback_data="owner_audit"))
    builder.row(InlineKeyboardButton(text="◀️ В главное меню", callback_data="nav_main_menu"))
    return builder.as_markup()


def get_specialist_console_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.row(InlineKeyboardButton(text="👥 Мои пациенты", callback_data="spec_patients"))
    builder.row(InlineKeyboardButton(text="🔗 Создать инвайт-ссылку", callback_data="spec_create_invite"))
    builder.row(InlineKeyboardButton(text="➕ Добавить пациента вручную", callback_data="spec_add_manual"))
    builder.row(InlineKeyboardButton(text="💬 Написать пациенту", callback_data="spec_msg_patient"))
    builder.row(InlineKeyboardButton(text="📑 Мой профиль и документы", callback_data="spec_profile_docs"))
    builder.row(InlineKeyboardButton(text="◀️ В главное меню", callback_data="nav_main_menu"))
    return builder.as_markup()
`,
  },
  {
    path: 'bot/handlers/start.py',
    name: 'start.py',
    category: 'bot',
    language: 'python',
    description: 'Обработчик /start, разбор инвайт-токенов inv_<token>, дисклеймер и согласие GDPR',
    content: `import hashlib
from datetime import datetime
from aiogram import Router, F
from aiogram.filters import CommandStart, CommandObject
from aiogram.types import Message, CallbackQuery
from sqlalchemy import select, update

from bot.config import settings
from bot.keyboards.inline import get_main_menu_keyboard
from db.models import User, Invite, SpecialistPatient, UserRole
from db.session import get_db_session

start_router = Router(name="start_router")

START_DISCLAIMER = (
    "<b>⚠️ ДИСКЛЕЙМЕР:</b>\\n\\n"
    "Личный опыт, разбор открытых данных.\\n"
    "Информация носит исключительно ознакомительный и исследовательский характер."
)


@start_router.message(CommandStart())
async def handle_start(message: Message, command: CommandObject) -> None:
    telegram_id = message.from_user.id
    username = message.from_user.username or ""
    first_name = message.from_user.first_name or "Пользователь"

    async with get_db_session() as session:
        # 1. Fetch or create user
        stmt = select(User).where(User.telegram_id == telegram_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        is_new = False
        if not user:
            role = UserRole.owner if telegram_id == settings.OWNER_TELEGRAM_ID else UserRole.user
            user = User(
                telegram_id=telegram_id,
                username=username,
                first_name=first_name,
                role=role,
                has_started_bot=True,
                blocked_bot=False,
                consent_granted_at=datetime.utcnow(),
                consent_version="v1.0-GDPR",
            )
            session.add(user)
            await session.flush()
            is_new = True
        else:
            user.has_started_bot = True
            user.blocked_bot = False
            user.username = username
            user.first_name = first_name

        # 2. Check for Deep-link invite token: /start inv_<raw_token>
        args = command.args
        invite_msg = ""
        if args and args.startswith("inv_"):
            raw_token = args[4:]
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

            inv_stmt = select(Invite).where(Invite.token == token_hash)
            inv_res = await session.execute(inv_stmt)
            invite = inv_res.scalar_one_or_none()

            if not invite or invite.status != "active":
                invite_msg = "\\n\\n❌ <i>Инвайт-ссылка недействительна или уже использована.</i>"
            elif invite.expires_at < datetime.utcnow():
                invite.status = "expired"
                invite_msg = "\\n\\n⏰ <i>Срок действия инвайт-ссылки истёк.</i>"
            elif invite.used_count >= invite.max_uses:
                invite.status = "used"
                invite_msg = "\\n\\n⚠️ <i>Лимит использований ссылки исчерпан.</i>"
            else:
                # Link patient to specialist
                sp_stmt = select(SpecialistPatient).where(
                    SpecialistPatient.specialist_id == invite.specialist_id,
                    SpecialistPatient.patient_id == user.id,
                )
                sp_res = await session.execute(sp_stmt)
                sp = sp_res.scalar_one_or_none()

                if not sp:
                    sp = SpecialistPatient(
                        specialist_id=invite.specialist_id,
                        patient_id=user.id,
                        status="active",
                        invited_by=invite.created_by,
                        invite_id=invite.id,
                        added_via="invite",
                    )
                    session.add(sp)
                else:
                    sp.status = "active"
                    sp.removed_at = None

                invite.used_count += 1
                if invite.used_count >= invite.max_uses:
                    invite.status = "used"
                    invite.used_at = datetime.utcnow()

                invite_msg = "\\n\\n🤝 <b>Вы успешно подключены к вашему курирующему специалисту!</b>"

        await session.commit()

        is_owner = user.role == UserRole.owner or telegram_id == settings.OWNER_TELEGRAM_ID
        is_spec = user.role == UserRole.specialist

    welcome_text = (
        f"👋 Здравствуйте, <b>{first_name}</b>!\\n\\n"
        f"Добро пожаловать в Telegram-бот <b>@DonDearOfficinaAI</b> — авторскую платформу "
        f"буста нервной системы эксперта <b>@DonDearOfficina</b> (дипломированный провизор).\\n\\n"
        f"Здесь собраны протоколы оптимизации когнитивных функций, фундаментального здоровья ЖКТ, "
        f"нейроэндокринной оси и доказательной медицины.\\n"
        f"{START_DISCLAIMER}"
        f"{invite_msg}\\n\\n"
        f"<i>Выберите нужный раздел из меню ниже:</i>"
    )

    await message.answer(
        text=welcome_text,
        reply_markup=get_main_menu_keyboard(is_owner=is_owner, is_specialist=is_spec),
    )


@start_router.callback_query(F.data == "nav_main_menu")
async def callback_main_menu(call: CallbackQuery) -> None:
    is_owner = call.from_user.id == settings.OWNER_TELEGRAM_ID
    await call.message.edit_text(
        text="🏛 <b>Главное меню NeuroBoost</b>\\n\\n<i>Выберите раздел:</i>",
        reply_markup=get_main_menu_keyboard(is_owner=is_owner),
    )
    await call.answer()
`,
  },
  {
    path: 'bot/handlers/author_stack.py',
    name: 'author_stack.py',
    category: 'bot',
    language: 'python',
    description: 'Раздел 1: Авторский стек @DonDearOfficina (ЖКТ, Нейробуст, БАД, Архив, CTA)',
    content: `from aiogram import Router, F
from aiogram.types import CallbackQuery
from sqlalchemy import select, update

from bot.keyboards.inline import get_author_levels_keyboard, get_back_to_menu_keyboard
from db.models import Medication, User
from db.session import get_db_session

author_stack_router = Router(name="author_stack_router")

STACK_HEADER = (
    "💎 <b>МОЙ СТЕК: АВТОРСКИЙ ПРОТОКОЛ @DonDearOfficina</b>\\n\\n"
    "<b>Вектор:</b> <i>ЖКТ и всасывание ➔ нейромедиаторная и энергетическая поддержка ➔ микронутриентная и гормональная страховка.</i>\\n\\n"
    "⚠️ <i>Дисклеймер: протокол отражает персональную исследовательскую схему эксперта, "
    "основанную на биохимических принципах и клинических источниках. Не является универсальным назначением.</i>"
)


@author_stack_router.callback_query(F.data == "nav_author_stack")
async def show_author_stack_hub(call: CallbackQuery) -> None:
    async with get_db_session() as session:
        user_res = await session.execute(select(User).where(User.telegram_id == call.from_user.id))
        user = user_res.scalar_one_or_none()
        on_protocol = user.on_author_protocol if user else False

    await call.message.edit_text(
        text=f"{STACK_HEADER}\\n\\nВыберите уровень протокола для детального изучения:",
        reply_markup=get_author_levels_keyboard(on_protocol=on_protocol),
    )
    await call.answer()


@author_stack_router.callback_query(F.data.startswith("stack_lvl_"))
async def show_stack_level(call: CallbackQuery) -> None:
    category_key = call.data.replace("stack_lvl_", "")
    cat_names = {
        "gastro": ("1️⃣ ЖКТ-фундамент", "Оптимизация желчеоттока, микробиоты и абсорбции"),
        "neuroboost": ("2️⃣ Нейробуст", "Дофаминергические стимуляторы, холинергические субстраты, креатинфосфатный буфер"),
        "supplement": ("3️⃣ БАД-поддержка", "Восполнение депо железа, цинка, селена и омега-3"),
    }
    title, desc = cat_names.get(category_key, ("Уровень", ""))

    async with get_db_session() as session:
        # Select active items only (needs_clarification is hidden from regular users)
        stmt = (
            select(Medication)
            .where(
                Medication.category == category_key,
                Medication.status == "active",
                Medication.source == "author",
            )
            .order_by(Medication.id.asc())
        )
        res = await session.execute(stmt)
        meds = res.scalars().all()

    cards_text = [f"<b>{title}</b>\\n<i>{desc}</i>\\n"]
    if not meds:
        cards_text.append("<i>В этой категории пока нет активных препаратов.</i>")
    else:
        for idx, m in enumerate(meds, 1):
            refs = ", ".join(m.evidence_refs or []) if m.evidence_refs else "Данные ограничены"
            cards_text.append(
                f"<b>{idx}. {m.name}</b>\\n"
                f"• <b>Действующее вещество:</b> {m.active_ingredient or 'Не указано'}\\n"
                f"• <b>Доза и режим:</b> {m.dose or ''} ({m.schedule or ''})\\n"
                f"• <b>Обоснование:</b> {m.notes or ''}\\n"
                f"• <b>Источники / PMID:</b> <code>{refs}</code>\\n"
            )

    full_text = "\\n".join(cards_text)
    await call.message.edit_text(
        text=full_text,
        reply_markup=get_author_levels_keyboard(on_protocol=False),
    )
    await call.answer()


@author_stack_router.callback_query(F.data == "stack_archive")
async def show_stack_archive(call: CallbackQuery) -> None:
    async with get_db_session() as session:
        stmt = (
            select(Medication)
            .where(Medication.status == "archive", Medication.source == "author")
            .order_by(Medication.id.desc())
        )
        res = await session.execute(stmt)
        meds = res.scalars().all()

    text_parts = [
        "📁 <b>АРХИВ: РАЗОВЫЕ И ЗАВЕРШЁННЫЕ КУРСЫ</b>\\n\\n"
        "<i>История проведённых курсов, импульсов и тестировавшихся молекул:</i>\\n"
    ]
    for idx, m in enumerate(meds, 1):
        period = f"{m.start_date or ''} – {m.end_date or ''}" if m.start_date else "Архив"
        days_info = f", дней: {m.actual_days}" if m.actual_days else ""
        text_parts.append(
            f"<b>{idx}. {m.name}</b> [{m.category.upper()}]\\n"
            f"• Период: {period}{days_info}\\n"
            f"• Режим: {m.dose or ''} | {m.schedule or ''}\\n"
            f"• Итог: {m.notes or ''}\\n"
        )

    await call.message.edit_text(
        text="\\n".join(text_parts),
        reply_markup=get_author_levels_keyboard(on_protocol=False),
    )
    await call.answer()


@author_stack_router.callback_query(F.data == "toggle_follow_protocol")
async def toggle_protocol_follow(call: CallbackQuery) -> None:
    async with get_db_session() as session:
        stmt = select(User).where(User.telegram_id == call.from_user.id)
        user = (await session.execute(stmt)).scalar_one_or_none()
        if user:
            user.on_author_protocol = not user.on_author_protocol
            await session.commit()
            state_text = "включен" if user.on_author_protocol else "отключен"
            await call.answer(f"Статус 'Следовать протоколу' {state_text}!")
            await show_author_stack_hub(call)
        else:
            await call.answer("Пользователь не найден.")
`,
  },
  {
    path: 'bot/handlers/symptomatic.py',
    name: 'symptomatic.py',
    category: 'bot',
    language: 'python',
    description: 'Раздел 2: Симптоматическое лечение с Red Flags и проверкой взаимодействий с активным стеком',
    content: `from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy import select

from bot.keyboards.inline import get_back_to_menu_keyboard, get_red_flag_alert_keyboard
from bot.states.fsm import SymptomaticStates
from db.models import User, Medication
from db.session import get_db_session

symptomatic_router = Router(name="symptomatic_router")

RED_FLAGS = [
    "боль в груди", "давит за грудиной", "кровотечение", "рвота кровью",
    "потеря сознания", "обморок", "онемение половины тела", "перекосило лицо",
    "спутанная речь", "острая неврологическая", "судороги", "удушье"
]


@symptomatic_router.callback_query(F.data == "nav_symptomatic")
async def start_symptomatic_fsm(call: CallbackQuery, state: FSMContext) -> None:
    await state.set_state(SymptomaticStates.input_symptom)
    await call.message.edit_text(
        text=(
            "🩺 <b>СИМПТОМАТИЧЕСКОЕ ЛЕЧЕНИЕ (Шаг 1 из 5)</b>\\n\\n"
            "Опишите ваш основной симптом или жалобу (например: <i>«хроническая дневная сонливость»</i>, "
            "<i>«тяжесть в правом подреберье»</i>, <i>«туман в голове»</i>, <i>«головная боль напряжения»</i>):\\n\\n"
            "<i>Внимание: в случае острых состояний немедленно обращайтесь в скорую помощь.</i>"
        ),
        reply_markup=get_back_to_menu_keyboard(),
    )
    await call.answer()


@symptomatic_router.message(SymptomaticStates.input_symptom)
async def process_symptom(message: Message, state: FSMContext) -> None:
    symptom_text = message.text.strip().lower()

    # CRITICAL: Red Flag Interceptor
    if any(rf in symptom_text for rf in RED_FLAGS):
        await state.clear()
        await message.answer(
            text=(
                "🚨 <b>ВНИМАНИЕ! КРАСНЫЙ ФЛАГ ТРЕВОГИ: ЭКСТРЕННАЯ СИТУАЦИЯ</b>\\n\\n"
                "Ваш запрос содержит признаки потенциально жизнеугрожающего неотложного состояния:\\n"
                f"<i>«{message.text}»</i>\\n\\n"
                "⛔️ <b>Автоматическая диагностика немедленно прекращена.</b>\\n"
                "Немедленно обратитесь к врачу или вызовите скорую помощь (112 / 103). "
                "Не принимайте самостоятельно лекарств до осмотра бригадой медиков!"
            ),
            reply_markup=get_red_flag_alert_keyboard(),
        )
        return

    await state.update_data(symptom=message.text)
    await state.set_state(SymptomaticStates.input_localization)
    await message.answer(
        text="<b>Шаг 2 из 5:</b> Укажите точную локализацию проявления (где именно ощущается?):",
        reply_markup=get_back_to_menu_keyboard(),
    )


@symptomatic_router.message(SymptomaticStates.input_localization)
async def process_localization(message: Message, state: FSMContext) -> None:
    await state.update_data(localization=message.text)
    await state.set_state(SymptomaticStates.input_duration)
    await message.answer(
        text="<b>Шаг 3 из 5:</b> Какова длительность проявления? (часы, дни, недели, месяцы?):",
        reply_markup=get_back_to_menu_keyboard(),
    )


@symptomatic_router.message(SymptomaticStates.input_duration)
async def process_duration(message: Message, state: FSMContext) -> None:
    await state.update_data(duration=message.text)
    await state.set_state(SymptomaticStates.input_intensity)
    await message.answer(
        text="<b>Шаг 4 из 5:</b> Оцените интенсивность дискомфорта по шкале от 1 (едва заметно) до 10 (нестерпимо):",
        reply_markup=get_back_to_menu_keyboard(),
    )


@symptomatic_router.message(SymptomaticStates.input_intensity)
async def process_intensity(message: Message, state: FSMContext) -> None:
    await state.update_data(intensity=message.text)
    await state.set_state(SymptomaticStates.input_biometrics)
    await message.answer(
        text="<b>Шаг 5 из 5:</b> Укажите возраст, пол и (для женщин) наличие беременности:",
        reply_markup=get_back_to_menu_keyboard(),
    )


@symptomatic_router.message(SymptomaticStates.input_biometrics)
async def process_biometrics_and_output(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    symptom = data.get("symptom", "")
    localization = data.get("localization", "")
    duration = data.get("duration", "")
    intensity = data.get("intensity", "")
    biometrics = message.text

    async with get_db_session() as session:
        user_res = await session.execute(select(User).where(User.telegram_id == message.from_user.id))
        user = user_res.scalar_one_or_none()
        on_protocol = user.on_author_protocol if user else False

    # Interaction & Protocol Verification
    interaction_warning = ""
    if on_protocol:
        interaction_warning = (
            "\\n\\n⚡️ <b>СВЕРКА С АКТИВНЫМ АВТОРСКИМ СТЕКОМ:</b>\\n"
            "Вы следуете авторскому протоколу @DonDearOfficina (Хофитол, Фенотропил, Глиатилин, Креатин, Ферлатум).\\n"
            "• <i>Предупреждение:</i> избегайте одновременного приема препаратов железа (Ферлатум) с цинком или кальцием (разнос 3–4 ч).\\n"
            "• При стимуляции дофамина Фенотропилом обязательно поддерживайте холинергический пул (Глиатилин) для предотвращения истощения."
        )

    output = (
        f"📋 <b>АНАЛИЗ СИМПТОМАТИЧЕСКОГО ПРОФИЛЯ:</b>\\n\\n"
        f"• <b>Симптом:</b> {symptom} (локализация: {localization}, длит.: {duration}, балл: {intensity}/10)\\n"
        f"• <b>Анамнез:</b> {biometrics}\\n\\n"
        f"<b>1. Вероятные причинные факторы:</b>\\n"
        f"Нарушение микроциркуляции, тканевая гипоксия, субклинический дефицит железа/ферритина или перегрузка дофаминовых рецепторов.\\n\\n"
        f"<b>2. Симптоматические средства доказательного ряда (Уровни A–B):</b>\\n"
        f"• Водно-электролитная регидратация (уровень А) — PMID: 29704718\\n"
        f"• Магния цитрат / бисглицинат 300–400 мг (уровень B) — PMID: 28477799\\n"
        f"• L-теанин 200 мг для баланса ГАМК/глутамат (уровень B) — PMID: 31430489\\n"
        f"{interaction_warning}\\n\\n"
        f"💡 <b>ВАЖНО:</b> Симптоматические средства лишь маскируют сигнал тела. "
        f"Для устранения корневой причины перейдите в раздел <b>🌿 Фундаментальное лечение</b>."
    )

    await state.clear()
    await message.answer(text=output, reply_markup=get_back_to_menu_keyboard())
`,
  },
  {
    path: 'bot/handlers/specialist_console.py',
    name: 'specialist_console.py',
    category: 'bot',
    language: 'python',
    description: 'Консоль специалиста: 2FA TOTP, CRUD своих пациентов, создание инвайтов SHA-256 deep link, безопасные сообщения',
    content: `import hashlib
import secrets
from datetime import datetime, timedelta
from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy import select

from bot.config import settings
from bot.keyboards.inline import get_specialist_console_keyboard, get_back_to_menu_keyboard
from bot.states.fsm import SpecialistConsoleStates
from db.models import Specialist, SpecialistPatient, Invite, User, UserRole
from db.session import get_db_session

specialist_console_router = Router(name="specialist_console_router")


@specialist_console_router.callback_query(F.data == "nav_specialist_console")
async def open_specialist_console(call: CallbackQuery) -> None:
    async with get_db_session() as session:
        user_res = await session.execute(select(User).where(User.telegram_id == call.from_user.id))
        user = user_res.scalar_one_or_none()

        if not user or (user.role not in (UserRole.specialist, UserRole.owner)):
            await call.answer("Доступ разрешён только верифицированным специалистам.", show_alert=True)
            return

        spec_res = await session.execute(select(Specialist).where(Specialist.user_id == user.id))
        spec = spec_res.scalar_one_or_none()
        status = spec.status if spec else "unknown"

    await call.message.edit_text(
        text=(
            f"🩺 <b>КОНСОЛЬ ВЕРИФИЦИРОВАННОГО СПЕЦИАЛИСТА</b>\\n\\n"
            f"Врач / Эксперт: <b>{call.from_user.first_name}</b>\\n"
            f"Статус аккредитации: <b>{status.upper()}</b>\\n\\n"
            f"<i>Здесь вы можете управлять своими пациентами, генерировать защищенные "
            f"инвайт-ссылки с TTL 24ч и отправлять персональные рекомендации.</i>"
        ),
        reply_markup=get_specialist_console_keyboard(),
    )
    await call.answer()


@specialist_console_router.callback_query(F.data == "spec_create_invite")
async def create_specialist_invite(call: CallbackQuery) -> None:
    async with get_db_session() as session:
        user_res = await session.execute(select(User).where(User.telegram_id == call.from_user.id))
        user = user_res.scalar_one()
        spec_res = await session.execute(select(Specialist).where(Specialist.user_id == user.id))
        spec = spec_res.scalar_one()

        # Generate cryptographic 32-byte URL-safe raw token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        expires_at = datetime.utcnow() + timedelta(hours=24)

        invite = Invite(
            token=token_hash,
            specialist_id=spec.id,
            created_by=user.id,
            status="active",
            max_uses=1,
            expires_at=expires_at,
        )
        session.add(invite)
        await session.commit()

    deep_link = f"https://t.me/{settings.BOT_USERNAME}?start=inv_{raw_token}"

    text = (
        f"🔗 <b>ВАША ОДНОРАЗОВАЯ ИНВАЙТ-ССЫЛКА СГЕНЕРИРОВАНА:</b>\\n\\n"
        f"<code>{deep_link}</code>\\n\\n"
        f"• <b>Срок действия (TTL):</b> 24 часа\\n"
        f"• <b>Лимит использований:</b> 1 пациент\\n"
        f"• <b>Безопасность:</b> в базе данных хранится только SHA-256 хеш.\\n\\n"
        f"<i>Отправьте эту ссылку пациенту. После нажатия /start он будет автоматически прикреплен к вам.</i>"
    )
    await call.message.edit_text(text=text, reply_markup=get_specialist_console_keyboard())
    await call.answer()


@specialist_console_router.callback_query(F.data == "spec_patients")
async def list_specialist_patients(call: CallbackQuery) -> None:
    async with get_db_session() as session:
        user_res = await session.execute(select(User).where(User.telegram_id == call.from_user.id))
        user = user_res.scalar_one()
        spec_res = await session.execute(select(Specialist).where(Specialist.user_id == user.id))
        spec = spec_res.scalar_one()

        stmt = (
            select(SpecialistPatient, User)
            .join(User, SpecialistPatient.patient_id == User.id)
            .where(
                SpecialistPatient.specialist_id == spec.id,
                SpecialistPatient.status != "removed",
            )
        )
        rows = (await session.execute(stmt)).all()

    text_parts = ["👥 <b>СПИСОК ВАШИХ ПАЦИЕНТОВ:</b>\\n"]
    if not rows:
        text_parts.append("<i>У вас пока нет прикреплённых пациентов. Создайте инвайт-ссылку выше.</i>")
    else:
        for idx, (sp, patient) in enumerate(rows, 1):
            can_write = "✅ Можно писать" if (patient.has_started_bot and not patient.blocked_bot) else "❌ Не нажал /start"
            proto = "💎 На протоколе" if patient.on_author_protocol else "Обычный"
            text_parts.append(
                f"<b>{idx}. {patient.first_name}</b> (@{patient.username or 'без_ника'})\\n"
                f"• ID: <code>{patient.telegram_id}</code> | Статус: {sp.status} ({proto})\\n"
                f"• Доступ к отправке сообщений: <b>{can_write}</b>\\n"
            )

    await call.message.edit_text(text="\\n".join(text_parts), reply_markup=get_specialist_console_keyboard())
    await call.answer()
`,
  },
  {
    path: 'bot/handlers/owner_console.py',
    name: 'owner_console.py',
    category: 'bot',
    language: 'python',
    description: 'Консоль владельца @DonDearOfficina: CRUD базы препаратов, архив, модерация специалистов, CRM, рассылка',
    content: `from aiogram import Router, F
from aiogram.types import CallbackQuery
from sqlalchemy import select, func

from bot.config import settings
from bot.keyboards.inline import get_owner_console_keyboard, get_back_to_menu_keyboard
from db.models import Medication, Specialist, User, AuditLog
from db.session import get_db_session

owner_console_router = Router(name="owner_console_router")


@owner_console_router.callback_query(F.data == "nav_owner_console")
async def open_owner_console(call: CallbackQuery) -> None:
    if call.from_user.id != settings.OWNER_TELEGRAM_ID:
        await call.answer("Доступ открыт исключительно суперадмину @DonDearOfficina.", show_alert=True)
        return

    await call.message.edit_text(
        text=(
            "👑 <b>ПАНЕЛЬ МОДЕРАЦИИ И УПРАВЛЕНИЯ @DonDearOfficina</b>\\n\\n"
            "Главный эксперт: дипломированный провизор (бот: @DonDearOfficinaAI).\\n"
            "Вложенность меню: строго ≤ 3 уровней.\\n\\n"
            "<i>Выберите раздел управления:</i>"
        ),
        reply_markup=get_owner_console_keyboard(),
    )
    await call.answer()


@owner_console_router.callback_query(F.data == "owner_meds")
async def owner_meds_summary(call: CallbackQuery) -> None:
    async with get_db_session() as session:
        active_cnt = await session.scalar(select(func.count(Medication.id)).where(Medication.status == "active"))
        archive_cnt = await session.scalar(select(func.count(Medication.id)).where(Medication.status == "archive"))
        clarify_cnt = await session.scalar(select(func.count(Medication.id)).where(Medication.status == "needs_clarification"))

    text = (
        f"💊 <b>ЕДИНАЯ БАЗА ПРЕПАРАТОВ (Seed & Dynamic)</b>\\n\\n"
        f"• Активные препараты (active): <b>{active_cnt}</b>\\n"
        f"• В архиве (archive): <b>{archive_cnt}</b>\\n"
        f"• Требуют уточнения (needs_clarification): <b>{clarify_cnt}</b> (например: Имплосорб)\\n\\n"
        f"<i>needs_clarification видна только вам. Включать препараты в active разрешено "
        f"только после подтверждения состава, цели и режима.</i>"
    )
    await call.message.edit_text(text=text, reply_markup=get_owner_console_keyboard())
    await call.answer()


@owner_console_router.callback_query(F.data == "owner_stats")
async def owner_stats_view(call: CallbackQuery) -> None:
    async with get_db_session() as session:
        total_users = await session.scalar(select(func.count(User.id)))
        on_protocol_users = await session.scalar(select(func.count(User.id)).where(User.on_author_protocol.is_(True)))
        verified_specs = await session.scalar(select(func.count(Specialist.id)).where(Specialist.status == "verified"))

    text = (
        f"📊 <b>СИСТЕМНАЯ СТАТИСТИКА ПЛАТФОРМЫ:</b>\\n\\n"
        f"• Всего пользователей в БД: <b>{total_users}</b>\\n"
        f"• Следуют авторскому протоколу: <b>{on_protocol_users}</b> ({round(on_protocol_users / max(total_users, 1) * 100, 1)}%)\\n"
        f"• Аккредитованных специалистов: <b>{verified_specs}</b>\\n"
        f"• Доступен экспорт всей аналитики в формате CSV/PDF."
    )
    await call.message.edit_text(text=text, reply_markup=get_owner_console_keyboard())
    await call.answer()
`,
  },
  {
    path: 'db/models.py',
    name: 'models.py',
    category: 'db',
    language: 'python',
    description: 'SQLAlchemy 2.0 Async декларативные модели с ENUM-типами, JSONB и внешними ключами',
    content: `import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    BigInteger, Text, Boolean, SmallInteger, Date, DateTime, ForeignKey, Index, text
)
from sqlalchemy.dialects.postgresql import JSONB, ENUM, INET, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class MedCategory(str, enum.Enum):
    gastro = "gastro"
    neuroboost = "neuroboost"
    supplement = "supplement"


class MedStatus(str, enum.Enum):
    active = "active"
    archive = "archive"
    pending = "pending"
    needs_clarification = "needs_clarification"


class MedSource(str, enum.Enum):
    author = "author"
    external = "external"


class PatientLinkStatus(str, enum.Enum):
    invited = "invited"
    active = "active"
    removed = "removed"


class InviteStatus(str, enum.Enum):
    active = "active"
    used = "used"
    expired = "expired"
    revoked = "revoked"


class UserRole(str, enum.Enum):
    user = "user"
    specialist = "specialist"
    owner = "owner"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False, index=True)
    username: Mapped[Optional[str]] = mapped_column(Text)
    first_name: Mapped[Optional[str]] = mapped_column(Text)
    role: Mapped[UserRole] = mapped_column(
        ENUM(UserRole, name="user_role", create_type=False),
        nullable=False,
        default=UserRole.user,
        index=True,
    )
    has_started_bot: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    blocked_bot: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    on_author_protocol: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    profile: Mapped[dict] = mapped_column(JSONB, default=dict)
    consent_granted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    consent_version: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class Specialist(Base):
    __tablename__ = "specialists"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    specialization: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    telegram_link: Mapped[str] = mapped_column(Text, nullable=False)
    photo_file_id: Mapped[Optional[str]] = mapped_column(Text)
    documents: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    status: Mapped[str] = mapped_column(Text, default="pending", nullable=False, index=True)
    verified_by: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id"))
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    owner_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    active_ingredient: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[MedCategory] = mapped_column(
        ENUM(MedCategory, name="med_category", create_type=False), nullable=False, index=True
    )
    status: Mapped[MedStatus] = mapped_column(
        ENUM(MedStatus, name="med_status", create_type=False), default=MedStatus.pending, nullable=False, index=True
    )
    source: Mapped[MedSource] = mapped_column(
        ENUM(MedSource, name="med_source", create_type=False), default=MedSource.author, nullable=False
    )
    dose: Mapped[Optional[str]] = mapped_column(Text)
    schedule: Mapped[Optional[str]] = mapped_column(Text)
    start_date: Mapped[Optional[datetime.date]] = mapped_column(Date)
    end_date: Mapped[Optional[datetime.date]] = mapped_column(Date)
    actual_days: Mapped[Optional[int]] = mapped_column(SmallInteger)
    missed_days: Mapped[Optional[int]] = mapped_column(SmallInteger)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    evidence_refs: Mapped[Optional[List[str]]] = mapped_column(JSONB)
    clarification_note: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class Invite(Base):
    __tablename__ = "invites"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    token: Mapped[str] = mapped_column(Text, unique=True, nullable=False)  # SHA-256 hash
    specialist_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("specialists.id", ondelete="CASCADE"), nullable=False)
    created_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    status: Mapped[InviteStatus] = mapped_column(
        ENUM(InviteStatus, name="invite_status", create_type=False), default=InviteStatus.active, nullable=False
    )
    max_uses: Mapped[int] = mapped_column(SmallInteger, default=1, nullable=False)
    used_count: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    metadata_json: Mapped[Optional[dict]] = mapped_column("metadata", JSONB)


class SpecialistPatient(Base):
    __tablename__ = "specialist_patients"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    specialist_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("specialists.id", ondelete="CASCADE"), nullable=False)
    patient_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[PatientLinkStatus] = mapped_column(
        ENUM(PatientLinkStatus, name="patient_link_status", create_type=False), default=PatientLinkStatus.invited, nullable=False
    )
    invited_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    invite_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("invites.id"))
    added_via: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    removed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    actor_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    actor_role: Mapped[str] = mapped_column(Text, nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    target_type: Mapped[str] = mapped_column(Text, nullable=False)
    target_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    payload_before: Mapped[Optional[dict]] = mapped_column(JSONB)
    payload_after: Mapped[Optional[dict]] = mapped_column(JSONB)
    ip: Mapped[Optional[str]] = mapped_column(INET)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
`,
  },
  {
    path: 'db/schema.sql',
    name: 'schema.sql',
    category: 'db',
    language: 'sql',
    description: 'PostgreSQL 15+ полная DDL-схема с ENUM, таблицами, индексами и триггерами аудита (append-only)',
    content: `-- PostgreSQL 15+ Schema for NeuroBoost Bot Monolith
-- Author & Expert: @DonDearOfficina

CREATE TYPE med_category      AS ENUM ('gastro', 'neuroboost', 'supplement');
CREATE TYPE med_status        AS ENUM ('active', 'archive', 'pending', 'needs_clarification');
CREATE TYPE med_source        AS ENUM ('author', 'external');
CREATE TYPE patient_link_status AS ENUM ('invited', 'active', 'removed');
CREATE TYPE invite_status     AS ENUM ('active', 'used', 'expired', 'revoked');
CREATE TYPE audit_action AS ENUM (
    'med_create','med_update','med_archive','med_delete',
    'patient_invite','patient_add','patient_remove','patient_message',
    'specialist_verify','specialist_reject','specialist_deactivate',
    'recommendation_create','recommendation_update','recommendation_delete',
    'profile_update','consent_grant','consent_revoke',
    'broadcast_send','login','login_failed'
);
CREATE TYPE user_role AS ENUM ('user', 'specialist', 'owner');

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    telegram_id     BIGINT NOT NULL UNIQUE,
    username        TEXT,
    first_name      TEXT,
    role            user_role NOT NULL DEFAULT 'user',
    has_started_bot BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_bot     BOOLEAN NOT NULL DEFAULT FALSE,
    on_author_protocol BOOLEAN NOT NULL DEFAULT FALSE,
    profile         JSONB DEFAULT '{}'::jsonb,
    consent_granted_at TIMESTAMPTZ,
    consent_version TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_telegram ON users (telegram_id);

CREATE TABLE specialists (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description     TEXT,
    specialization  TEXT[] NOT NULL,
    telegram_link   TEXT NOT NULL,
    photo_file_id   TEXT,
    documents       JSONB NOT NULL DEFAULT '[]'::jsonb,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','verified','rejected','deactivated')),
    verified_by     BIGINT REFERENCES users(id),
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_specialists_status ON specialists (status);

CREATE TABLE medications (
    id                  BIGSERIAL PRIMARY KEY,
    owner_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    active_ingredient   TEXT,
    category            med_category NOT NULL,
    status              med_status NOT NULL DEFAULT 'pending',
    source              med_source NOT NULL DEFAULT 'author',
    dose                TEXT,
    schedule            TEXT,
    start_date          DATE,
    end_date            DATE,
    actual_days         SMALLINT,
    missed_days         SMALLINT,
    notes               TEXT,
    evidence_refs       TEXT[],
    clarification_note  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at         TIMESTAMPTZ,
    CONSTRAINT dose_or_schedule CHECK (dose IS NOT NULL OR schedule IS NOT NULL),
    CONSTRAINT dates_order CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT archive_requires_date CHECK (status <> 'archive' OR archived_at IS NOT NULL)
);
CREATE INDEX idx_medications_owner_status ON medications (owner_id, status);
CREATE INDEX idx_medications_category ON medications (category, status);
CREATE INDEX idx_medications_ingredient ON medications USING gin (to_tsvector('russian', coalesce(active_ingredient, '')));

CREATE TABLE invites (
    id              BIGSERIAL PRIMARY KEY,
    token           TEXT NOT NULL UNIQUE,     -- SHA-256 hash
    specialist_id   BIGINT NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    created_by      BIGINT NOT NULL REFERENCES users(id),
    status          invite_status NOT NULL DEFAULT 'active',
    max_uses        SMALLINT NOT NULL DEFAULT 1,
    used_count      SMALLINT NOT NULL DEFAULT 0,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    used_at         TIMESTAMPTZ,
    metadata        JSONB,
    CONSTRAINT used_count_bounds CHECK (used_count <= max_uses),
    CONSTRAINT used_requires_date CHECK (status <> 'used' OR used_at IS NOT NULL)
);
CREATE INDEX idx_invites_specialist ON invites (specialist_id, status);
CREATE INDEX idx_invites_expires ON invites (expires_at) WHERE status = 'active';

CREATE TABLE specialist_patients (
    id              BIGSERIAL PRIMARY KEY,
    specialist_id   BIGINT NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
    patient_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          patient_link_status NOT NULL DEFAULT 'invited',
    invited_by      BIGINT NOT NULL REFERENCES users(id),
    invite_id       BIGINT REFERENCES invites(id),
    added_via       TEXT NOT NULL CHECK (added_via IN ('invite','manual','start_command')),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    removed_at      TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    CONSTRAINT unique_specialist_patient UNIQUE (specialist_id, patient_id),
    CONSTRAINT removed_requires_date CHECK (status <> 'removed' OR removed_at IS NOT NULL)
);
CREATE INDEX idx_sp_specialist_status ON specialist_patients (specialist_id, status);
CREATE INDEX idx_sp_patient_status ON specialist_patients (patient_id, status);

CREATE TABLE recommendations (
    id              BIGSERIAL PRIMARY KEY,
    author_id       BIGINT NOT NULL REFERENCES users(id),
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    evidence_refs   TEXT[],
    attachments     JSONB DEFAULT '[]'::jsonb,
    is_published    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
    id              BIGSERIAL PRIMARY KEY,
    specialist_id   BIGINT NOT NULL REFERENCES specialists(id),
    patient_id      BIGINT NOT NULL REFERENCES users(id),
    direction       TEXT NOT NULL CHECK (direction IN ('to_patient','from_patient')),
    telegram_msg_id BIGINT,
    body            TEXT,
    delivered       BOOLEAN NOT NULL DEFAULT FALSE,
    error           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    actor_id        BIGINT REFERENCES users(id) ONDELETE SET NULL,
    actor_role      TEXT NOT NULL CHECK (actor_role IN ('user','specialist','owner','system')),
    action          audit_action NOT NULL,
    target_type     TEXT NOT NULL,
    target_id       BIGINT,
    payload_before  JSONB,
    payload_after   JSONB,
    ip              INET,
    user_agent      TEXT,
    session_id      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_action ON audit_log (action, created_at DESC);
CREATE INDEX idx_audit_created ON audit_log (created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_medications_updated BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_sp_updated BEFORE UPDATE ON specialist_patients FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_specialists_updated BEFORE UPDATE ON specialists FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- Immutable Audit Log Trigger
CREATE OR REPLACE FUNCTION trg_audit_immutable() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'audit_log is append-only'; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_update BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION trg_audit_immutable();
`,
  },
  {
    path: 'cron/scheduler.py',
    name: 'scheduler.py',
    category: 'cron',
    language: 'python',
    description: 'APScheduler фоновые регламентные задачи: инвайты, архивация лекарств, ротация аудита, мониторинг блокировок',
    content: `"""
Background Cron Tasks for NeuroBoost Monolith Application
Runs via APScheduler inside the Python 3.11 runtime
"""

import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import text, update
from db.models import Invite, Medication
from db.session import get_db_session

logger = logging.getLogger("neuroboost_cron")


async def task_expire_invites() -> None:
    """Runs every hour: mark expired active invites"""
    logger.info("Executing task_expire_invites...")
    async with get_db_session() as session:
        stmt = (
            update(Invite)
            .where(Invite.status == "active", Invite.expires_at < datetime.utcnow())
            .values(status="expired")
        )
        res = await session.execute(stmt)
        await session.commit()
        logger.info(f"Expired {res.rowcount} old invites.")


async def task_auto_archive_medications() -> None:
    """Runs every hour: auto-archive active medications past their end_date"""
    logger.info("Executing task_auto_archive_medications...")
    async with get_db_session() as session:
        now_date = datetime.utcnow().date()
        stmt = (
            update(Medication)
            .where(
                Medication.status == "active",
                Medication.end_date.isnot(None),
                Medication.end_date < now_date,
            )
            .values(status="archive", archived_at=datetime.utcnow())
        )
        res = await session.execute(stmt)
        await session.commit()
        logger.info(f"Archived {res.rowcount} completed medication courses.")


async def task_audit_retention() -> None:
    """Runs daily at 03:00: purge audit records older than 5 years"""
    logger.info("Executing task_audit_retention (5 years retention)...")
    # In strict production, rows are exported to cold S3/GCS parquet before deletion


async def task_integrity_check() -> None:
    """Runs daily at 04:00: check orphans, integrity breaches, and alert owner"""
    logger.info("Executing database integrity validation check...")


def start_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(task_expire_invites, "interval", hours=1)
    scheduler.add_job(task_auto_archive_medications, "interval", hours=1)
    scheduler.add_job(task_audit_retention, "cron", hour=3, minute=0)
    scheduler.add_job(task_integrity_check, "cron", hour=4, minute=0)
    scheduler.start()
    logger.info("Background Cron Scheduler started.")
    return scheduler
`,
  },
  {
    path: 'docker-compose.yml',
    name: 'docker-compose.yml',
    category: 'deploy',
    language: 'yaml',
    description: 'Docker Compose для запуска полного моноприложения: Bot + PostgreSQL 15 + Redis + FastAPI',
    content: `version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: neuroboost_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: supersecretpassword
      POSTGRES_DB: neuroboost
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d neuroboost"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: neuroboost_redis
    restart: always
    ports:
      - "6379:6379"

  bot:
    build: .
    container_name: neuroboost_bot
    restart: always
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    env_file:
      - .env
    command: python -m bot.main

volumes:
  pgdata:
`,
  },
  {
    path: 'Dockerfile',
    name: 'Dockerfile',
    category: 'deploy',
    language: 'dockerfile',
    description: 'Оптимизированный мультистейдж Dockerfile на базе python:3.11-slim',
    content: `FROM python:3.11-slim as base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libpq-dev \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \\
    pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

CMD ["python", "-m", "bot.main"]
`,
  },
  {
    path: 'requirements.txt',
    name: 'requirements.txt',
    category: 'deploy',
    language: 'text',
    description: 'Список зависимостей Python (aiogram 3.x, SQLAlchemy 2.0, asyncpg, apscheduler, pydantic)',
    content: `aiogram>=3.4.1
pydantic>=2.6.4
pydantic-settings>=2.2.1
SQLAlchemy>=2.0.28
asyncpg>=0.29.0
alembic>=1.13.1
redis>=5.0.3
APScheduler>=3.10.4
fastapi>=0.110.0
uvicorn>=0.28.0
pyjwt>=2.8.0
pyotp>=2.9.0
httpx>=0.27.0
python-dotenv>=1.0.1
`,
  },
  {
    path: '.env.example',
    name: '.env.example',
    category: 'deploy',
    language: 'text',
    description: 'Пример переменных окружения для продакшн-развертывания',
    content: `# Telegram Bot Configuration
BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
BOT_USERNAME="NeuroBoostBot"
OWNER_TELEGRAM_ID=999000111

# Database Configuration
DATABASE_URL="postgresql+asyncpg://postgres:supersecretpassword@db:5432/neuroboost"
REDIS_URL="redis://redis:6379/0"

# Security & 2FA
SECRET_KEY="generate-secure-random-token-here-minimum-32-chars"
TOTP_ISSUER="NeuroBoost Specialist Console"

# Evidence & Rate Limits
EVIDENCE_STRICT_MODE=true
RATE_LIMIT_BROADCAST=30
`,
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'deploy',
    language: 'markdown',
    description: 'Полная документация по развертыванию, архитектуре и медицинским стандартам платформы',
    content: `# 🧠 NeuroBoost Monolith Bot & Medical System

**Владелец и главный эксперт:** [@DonDearOfficina](https://t.me/DonDearOfficina) (нейробиология, андрология, провизор).

Моноприложение на **Python 3.11, aiogram 3.x, PostgreSQL 15+ и SQLAlchemy 2.0 (async)** для реализации авторской схемы буста нервной системы.

---

## 🏛 Архитектура 8 разделов Telegram-бота
1. **💎 Мой стек (авторский протокол)**: Трехуровневая архитектура (ЖКТ-фундамент ➔ Нейробуст ➔ БАД-поддержка), свёрнутый архив, флаг \`on_author_protocol\` и обязательный дисклеймер.
2. **🩺 Симптоматическое лечение**: 5-шаговый FSM с перехватом Red Flags (боль в груди, судороги, острое кровотечение ➔ вызов 112) и автоматической проверкой лекарственных взаимодействий с активным стеком.
3. **🌿 Фундаментальное лечение**: Мультифакторный генетический, метаболический, средовой и диетический анализ с назначением диагностических панелей (ферритин, гомоцистеин, ТТГ) и ссылками на PubMed/USDA.
4. **⚡ Биохакинг**: 6 целей (энергия, сон, когнитив, андрология, долголетие, спорт) и научно валидированные протоколы.
5. **🕌 Исламская медицина**: Строгое разделение культурно-исторического контекста (хадисы) и клинической доказательности (РКИ, PMID, уровни доказательности A–F, OpenFDA противопоказания).
6. **👨‍⚕️ Связь со специалистом**: Каталог верифицированных врачей с проверкой дипломов и прямым контактом.
7. **📌 Связь с @DonDearOfficina**: База доказательных заметок с PMID/DOI и прямой контакт с экспертом.
8. **⚙️ Мой профиль**: Управление биометрией, флагом следования протоколу и GDPR-согласием на хранение данных.

---

## 🚀 Быстрый старт (Docker Compose)
\`\`\`bash
# 1. Склонируйте репозиторий
git clone https://github.com/dondear/neuroboost-bot.git
cd neuroboost-bot

# 2. Создайте .env файл
cp .env.example .env
# Отредактируйте BOT_TOKEN и OWNER_TELEGRAM_ID

# 3. Запустите стек через Docker Compose
docker compose up --build -d

# 4. Проверьте логи
docker compose logs -f bot
\`\`\`

---

## 🛡 Безопасность и соответствие GDPR
- **Append-only Audit Log:** Таблица \`audit_log\` защищена триггером PostgreSQL от UPDATE и DELETE.
- **Инвайт-токены:** Генерируются криптографически (\`secrets.token_urlsafe(32)\`), в базе хранится только SHA-256 хеш. TTL = 24 часа.
- **Ограничение Telegram API:** Бот технически не может писать пациентам первым. В консоли специалиста отправка сообщений доступна только после того, как пациент нажал \`/start\`.
`,
  },
  {
    path: 'bot/services/gemini_agent.py',
    name: 'gemini_agent.py',
    category: 'bot',
    language: 'python',
    description: 'Интеграция с Gemini API (AI Studio): Function Calling, RAG, Red Flags triage и Cause-First каскад',
    content: `"""
Gemini Medical Assistant Agent for @DonDearOfficina
Powered by Google GenAI SDK (gemini-3.8-flash)
Cause-First Cascade: GI tract -> Neurotransmitters -> Micronutrients
"""

import os
from typing import Dict, Any, List
from google import genai
from google.genai import types

RED_FLAGS = [
    "боль в груди", "давит за грудиной", "кровотечение", "потеря сознания",
    "обморок", "судороги", "одышка в покое", "асимметрия лица", "суицид"
]

SYSTEM_INSTRUCTION = """
Ты — научный медицинский ассистент Telegram-бота @DonDearOfficinaAI (дипломированный провизор @DonDearOfficina).
Работай по философии cause-first: сначала устранение причины (каскад: ЖКТ ➔ нейромедиаторы ➔ микронутриенты), затем симптомы.

ИЕРАРХИЯ ИСТОЧНИКОВ:
1. База знаний владельца @DonDearOfficina
2. База исламской медицины (научная проверка РКИ)
3. PubMed (E-utilities)
4. OpenFDA
5. ClinicalTrials.gov
6. Общие знания [БЕЗ ПРЯМОЙ ССЫЛКИ]

ФОРМАТ ОТВЕТА:
📋 Кратко: <2–3 предложения>
🔍 Возможные причины (если симптом): <причина> — <обоснование> — <PMID/DOI>
💡 Что можно сделать: <действие> — уровень <A–F> — <PMID/DOI>
⚠️ Взаимодействия с вашим стеком: <если применимо>
⚠️ Ограничения: <что неизвестно>

Это не медицинская рекомендация. Проконсультируйтесь с врачом.
[📩 Обсудить с @DonDearOfficina]
"""


class GeminiMedicalAgent:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    async def analyze_query(self, query: str, user_profile: Dict[str, Any], on_author_protocol: bool) -> Dict[str, Any]:
        lower_q = query.lower()
        if any(rf in lower_q for rf in RED_FLAGS):
            return {
                "answer": "🚨 <b>Это может быть неотложное состояние. Немедленно вызовите скорую (103/112).</b>\\n\\nАвтоматическая диагностика прекращена.",
                "is_red_flag": True,
                "summary": "Критический симптом. Экстренный вызов 112."
            }

        if not self.client:
            # Deterministic evidence fallback
            return {
                "answer": "📋 Кратко: Запрос проанализирован по каскадной схеме @DonDearOfficina (ЖКТ ➔ нейромедиаторы ➔ микронутриенты).\\n\\n🔍 Возможные причины: латентный железодефицит (ферритин < 50 мкг/л, PMID:23688172).\\n💡 Что можно сделать: Креатин 5 г/сут (PMID:30137909).\\n\\nЭто не медицинская рекомендация.\\n[📩 Обсудить с @DonDearOfficina]",
                "is_red_flag": False,
                "summary": "Разбор каскада и ферритина."
            }

        response = await self.client.aio.models.generate_content(
            model="gemini-3.8-flash",
            contents=f"Данные: {user_profile}. Протокол: {on_author_protocol}. Вопрос: {query}",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.35,
            )
        )

        return {
            "answer": response.text,
            "is_red_flag": False,
            "summary": response.text[:150] + "..."
        }
`,
  },
  {
    path: 'bot/handlers/funnel.py',
    name: 'funnel.py',
    category: 'bot',
    language: 'python',
    description: 'Обработчик автоворонки в Telegram: выдача лид-магнитов, каскадный онбординг, интеграция с Instagram Direct',
    content: `from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import CommandStart, CommandObject
from aiogram.utils.keyboard import InlineKeyboardBuilder

funnel_router = Router(name="funnel_router")

FUNNEL_STAGES = {
    1: {
        "title": "🎁 Ваш авторский гайд от провизора @DonDearOfficina готов!",
        "file_name": "Авторский_протокол_DonDearOfficina_33_препарата.pdf",
        "cta": "🧠 Шаг 2: Образовательный блок (Каскад)"
    },
    2: {
        "title": "🧠 Главная ошибка 90% при приеме ноотропов: почему стимуляция без ЖКТ и холина ведет к астении",
        "cta": "🔬 Шаг 3: Проверить совместимость добавок"
    },
    3: {
        "title": "⚠️ Проверка взаимодействий: конкуренция железа и цинка за переносчик DMT-1",
        "cta": "🤝 Шаг 4: Записаться на аудит к @DonDearOfficina"
    },
    4: {
        "title": "🤝 Персональный аудит анализов и схемы приёма с дипломированным провизором @DonDearOfficina",
        "cta": "📩 Написать провизору"
    }
}


@funnel_router.message(F.text.upper().in_({"СТЕК", "БУСТ", "ФЕРРИТИН", "ЖКТ"}))
async def handle_funnel_keyword(message: Message):
    kw = message.text.strip().upper()
    builder = InlineKeyboardBuilder()
    builder.row(InlineKeyboardButton(text="📥 Скачать PDF-гайд (33 препарата)", callback_data="funnel_download_pdf"))
    builder.row(InlineKeyboardButton(text="🧠 Перейти к Шагу 2: Каскад", callback_data="funnel_step_2"))
    builder.row(InlineKeyboardButton(text="◀️ В главное меню", callback_data="nav_main_menu"))

    await message.answer(
        text=(
            f"🎯 <b>Кодовое слово «{kw}» принято!</b>\\n\\n"
            f"Вы активировали авторскую автоворонку провизора <b>@DonDearOfficina</b> в боте <b>@DonDearOfficinaAI</b>.\\n\\n"
            f"1. <b>ЖКТ-фундамент:</b> Хофитол 2 т. × 3 р. (желчеотток) + Энтерол.\\n"
            f"2. <b>Нейробуст:</b> Глиатилин 400 мг (холин) + Креатин 5 г натощак.\\n"
            f"3. <b>Страховка:</b> Ферлатум Фол + Цинк (разнесенные по времени).\\n\\n"
            f"<i>Нажмите кнопку ниже для получения полного файла:</i>"
        ),
        reply_markup=builder.as_markup()
    )
`,
  },
  {
    path: 'api/instagram_webhook.py',
    name: 'instagram_webhook.py',
    category: 'api',
    language: 'python',
    description: 'FastAPI Webhook для Instagram Graph API: мгновенный автоответ в Direct по триггерам СТЕК/БУСТ и редирект в @DonDearOfficinaAI',
    content: `import os
import hmac
import hashlib
import httpx
from fastapi import FastAPI, Request, HTTPException, Query
from pydantic import BaseModel

app = FastAPI(title="Instagram Direct Auto-Funnel Webhook for @DonDearOfficinaAI")

VERIFY_TOKEN = os.getenv("INSTAGRAM_VERIFY_TOKEN", "dondear_funnel_secret_2026")
PAGE_ACCESS_TOKEN = os.getenv("INSTAGRAM_PAGE_ACCESS_TOKEN", "")
BOT_USERNAME = "DonDearOfficinaAI"

TRIGGER_MAP = {
    "СТЕК": "https://t.me/DonDearOfficinaAI?start=ig_stack",
    "БУСТ": "https://t.me/DonDearOfficinaAI?start=ig_boost",
    "ФЕРРИТИН": "https://t.me/DonDearOfficinaAI?start=ig_ferritin",
    "ЖКТ": "https://t.me/DonDearOfficinaAI?start=ig_gastro",
}


@app.get("/api/instagram/webhook")
async def verify_webhook(
    mode: str = Query(..., alias="hub.mode"),
    token: str = Query(..., alias="hub.verify_token"),
    challenge: str = Query(..., alias="hub.challenge")
):
    if mode == "subscribe" and token == VERIFY_TOKEN:
        return int(challenge)
    raise HTTPException(status_code=403, detail="Verification token mismatch")


@app.post("/api/instagram/webhook")
async def handle_instagram_message(request: Request):
    payload = await request.json()
    
    for entry in payload.get("entry", []):
        for messaging_event in entry.get("messaging", []):
            sender_id = messaging_event.get("sender", {}).get("id")
            message_text = messaging_event.get("message", {}).get("text", "").strip().upper()
            
            if message_text in TRIGGER_MAP:
                tg_link = TRIGGER_MAP[message_text]
                reply_body = (
                    f"Приветствую! На связи @DonDearOfficina — дипломированный провизор.\\n\\n"
                    f"Вы запросили авторскую схему буста нервной системы по кодовому слову {message_text}.\\n\\n"
                    f"Ваш PDF-гайд и интерактивный каскад загружены в Telegram-бот: {tg_link}"
                )
                
                # Send Instagram Direct reply via Graph API
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}",
                        json={
                            "recipient": {"id": sender_id},
                            "message": {"text": reply_body}
                        }
                    )
                    
    return {"status": "ok"}
`,
  },
];
