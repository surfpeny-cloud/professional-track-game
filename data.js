// Навыки для выбора
const SKILLS = {
    creativity: { name: "Креативность", type: "workshop", emoji: "💡" },
    analytics: { name: "Аналитика", type: "workshop", emoji: "📊" },
    planning: { name: "Проектирование", type: "workshop", emoji: "📐" },
    responsibility: { name: "Ответственность", type: "foundation", emoji: "🎯" },
    communication: { name: "Коммуникация", type: "foundation", emoji: "💬" },
    teamwork: { name: "Командная работа", type: "foundation", emoji: "👥" },
    leadership: { name: "Лидерство", type: "foundation", emoji: "🌟" },
    problemsolving: { name: "Решение проблем", type: "workshop", emoji: "🔧" }
};

// Цвета для игроков
const PLAYER_COLORS = {
    red: { name: "Красный", emoji: "🔴", hex: "#ff6b6b" },
    blue: { name: "Синий", emoji: "🔵", hex: "#74b9ff" },
    green: { name: "Зеленый", emoji: "🟢", hex: "#00b894" },
    yellow: { name: "Желтый", emoji: "🟡", hex: "#fdcb6e" },
    purple: { name: "Фиолетовый", emoji: "🟣", hex: "#6c5ce7" },
    orange: { name: "Оранжевый", emoji: "🟠", hex: "#fd9644" }
};

// Игровое поле - 20 клеток (для физического поля)
const GAME_BOARD = [
    { type: 'green', position: 1, name: 'Старт' },
    { type: 'green', position: 2, name: 'Проф. рост' },
    { type: 'blue', position: 3, name: 'Нетворкинг' },
    { type: 'green', position: 4, name: 'Навыки' },
    { type: 'yellow', position: 5, name: 'Событие' },
    { type: 'green', position: 6, name: 'Кейс' },
    { type: 'purple', position: 7, name: 'Профессия' },
    { type: 'green', position: 8, name: 'Вызов' },
    { type: 'blue', position: 9, name: 'Команда' },
    { type: 'green', position: 10, name: 'Проект' },
    { type: 'yellow', position: 11, name: 'Кризис' },
    { type: 'green', position: 12, name: 'Решение' },
    { type: 'purple', position: 13, name: 'Инновация' },
    { type: 'green', position: 14, name: 'Развитие' },
    { type: 'blue', position: 15, name: 'Партнерство' },
    { type: 'green', position: 16, name: 'Экспертиза' },
    { type: 'yellow', position: 17, name: 'Тренды' },
    { type: 'green', position: 18, name: 'Мастерство' },
    { type: 'purple', position: 19, name: 'Будущее' },
    { type: 'green', position: 20, name: 'Финиш' }
];

// Задания для каждого типа клеток
const QUESTS = {
    green: [
        {
            title: "Разработка мобильного приложения",
            description: "Разработать концепцию мобильного приложения для пожилых людей, которые плохо видят",
            instructions: [
                "1. Проанализировать целевую аудиторию (требуется навык 'Аналитика')",
                "2. Придумать нестандартное решение (требуется навык 'Креативность')", 
                "3. Составить план реализации (требуется навык 'Проектирование')",
                "4. Пропустить ход (без потерь)"
            ],
            requiredSkills: ["analytics", "creativity", "planning"],
            rewards: [
                "+2 Репутации при наличии навыка",
                "+1 Репутации при аргументации", 
                "Опыт в проектировании интерфейсов"
            ],
            difficulty: "medium"
        },
        {
            title: "Убеждение клиента",
            description: "Убедить условного клиента инвестировать в ваш стартап за 1 минуту",
            instructions: [
                "1. Подготовить презентацию (требуется навык 'Коммуникация')",
                "2. Проанализировать выгоды для клиента (требуется навык 'Аналитика')",
                "3. Найти эмоциональный подход (требуется навык 'Эмпатия')", 
                "4. Пропустить ход (без потерь)"
            ],
            requiredSkills: ["communication", "analytics"],
            rewards: [
                "+2 Репутации при наличии навыка",
                "Навык публичных выступлений",
                "Опыт ведения переговоров"
            ],
            difficulty: "hard"
        },
        {
            title: "Вопрос на эрудицию", 
            description: "Назови 3 soft skills, которые важны для врача и почему",
            instructions: [
                "1. Использовать медицинские знания (требуется эрудиция)",
                "2. Проанализировать работу врача (требуется навык 'Аналитика')",
                "3. Привести примеры из жизни (требуется навык 'Коммуникация')",
                "4. Пропустить ход (без потерь)"
            ],
            requiredSkills: ["analytics", "communication"],
            rewards: [
                "+1 Репутации за каждый названный навык",
                "Понимание междисциплинарных связей",
                "Развитие критического мышления"
            ],
            difficulty: "easy"
        }
    ],
    blue: [
        {
            title: "Совместный проект",
            description: "Представьте, что вы работаете в команде. Придумайте название для совместного проекта и распределите роли",
            instructions: [
                "1. Провести мозговой штурм (требуется навык 'Креативность')",
                "2. Учесть разные мнения (требуется навык 'Командная работа')", 
                "3. Распределить задачи по силам (требуется навык 'Лидерство')",
                "4. Пропустить ход (без потерь)"
            ],
            requiredSkills: ["creativity", "teamwork", "leadership"],
            rewards: [
                "+3 Репутации за успешную коллаборацию",
                "Опыт командной работы",
                "Навыки распределения задач"
            ],
            difficulty: "medium"
        }
    ],
    yellow: [
        {
            title: "Кризис в отрасли",
            description: "В вашей профессиональной области кризис! Нужно быстро адаптироваться и найти новые возможности",
            instructions: [
                "1. Проанализировать ситуацию (требуется навык 'Аналитика')",
                "2. Найти новые возможности (требуется навык 'Креативность')", 
                "3. Составить план действий (требуется навык 'Проектирование')",
                "4. Переждать кризис (без потерь)"
            ],
            requiredSkills: ["analytics", "creativity", "planning"],
            rewards: [
                "+2 Репутации за адаптацию", 
                "Опыт работы в кризисных ситуациях",
                "Умение находить возможности"
            ],
            difficulty: "hard"
        }
    ],
    purple: [
        {
            title: "Создание профессии будущего",
            description: "Поздравляю! Ты получил возможность создать профессию будущего! Опиши ее основные характеристики",
            instructions: [
                "1. Придумать название профессии",
                "2. Описать ее пользу для общества", 
                "3. Определить 3 ключевых навыка",
                "4. Представить, чем будет заниматься специалист"
            ],
            requiredSkills: ["creativity", "analytics", "planning"],
            rewards: [
                "+5 Репутации за создание профессии",
                "Уникальное достижение в профиле",
                "Опыт инновационного мышления"
            ],
            difficulty: "epic"
        }
    ]
};

// Уровни карьерного роста
const CAREER_LEVELS = {
    intern: { name: "Стажер", reputation: 0, bonus: "" },
    specialist: { name: "Специалист", reputation: 5, bonus: "Можете помогать другим" },
    expert: { name: "Эксперт", reputation: 10, bonus: "+1 к броскам кубика" },
    leader: { name: "Лидер рынка", reputation: 15, bonus: "Влияние на развитие" }
};

// Магазин улучшений
const SHOP_ITEMS = {
    skills: {
        name: "🎯 Навыки",
        items: [
            {
                id: "extra_skill",
                name: "Дополнительный навык",
                description: "Откройте третий навык для большего выбора решений",
                icon: "💡",
                price: 8,
                type: "permanent",
                effect: "add_skill_slot",
                maxLevel: 1,
                featured: true
            },
            {
                id: "skill_boost",
                name: "Прокачка навыка",
                description: "+1 к проверкам с выбранным навыком на 3 хода",
                icon: "⚡",
                price: 5,
                type: "temporary",
                effect: "skill_boost",
                duration: 3,
                featured: false
            }
        ]
    },
    dice: {
        name: "🎲 Улучшения кубика",
        items: [
            {
                id: "lucky_dice",
                name: "Везучий кубик",
                description: "Перебросьте кубик один раз за ход",
                icon: "🍀",
                price: 6,
                type: "consumable",
                effect: "reroll_dice",
                uses: 1,
                featured: true
            },
            {
                id: "dice_boost",
                name: "Улучшенный бросок",
                description: "+1 к следующему броску кубика",
                icon: "🎯",
                price: 3,
                type: "consumable",
                effect: "dice_bonus",
                bonus: 1,
                uses: 1,
                featured: false
            },
            {
                id: "double_roll",
                name: "Двойной бросок",
                description: "Бросьте два кубика и выберите лучший результат",
                icon: "🎲",
                price: 10,
                type: "consumable",
                effect: "advantage_roll",
                uses: 1,
                featured: false
            }
        ]
    },
    reputation: {
        name: "⭐ Репутация",
        items: [
            {
                id: "reputation_boost",
                name: "Буст репутации",
                description: "Мгновенно получите +2 к репутации",
                icon: "📈",
                price: 7,
                type: "instant",
                effect: "add_reputation",
                amount: 2,
                featured: false
            },
            {
                id: "reputation_multiplier",
                name: "Множитель репутации",
                description: "Удвойте репутацию за следующее задание",
                icon: "✨",
                price: 8,
                type: "consumable",
                effect: "reputation_multiplier",
                multiplier: 2,
                uses: 1,
                featured: true
            }
        ]
    },
    special: {
        name: "🚀 Особые умения",
        items: [
            {
                id: "time_extend",
                name: "Дополнительное время",
                description: "+2 минуты на выполнение следующего задания",
                icon: "⏰",
                price: 4,
                type: "consumable",
                effect: "time_extension",
                minutes: 2,
                uses: 1,
                featured: false
            },
            {
                id: "skip_quest",
                name: "Пропуск задания",
                description: "Пропустите текущее задание без потерь",
                icon: "🏃‍♂️",
                price: 6,
                type: "consumable",
                effect: "skip_quest",
                uses: 1,
                featured: false
            },
            {
                id: "inspiration",
                name: "Источник вдохновения",
                description: "Получите подсказку для выполнения задания",
                icon: "💫",
                price: 5,
                type: "consumable",
                effect: "get_hint",
                uses: 1,
                featured: false
            }
        ]
    }
};

// Категории магазина
const SHOP_CATEGORIES = [
    { id: "skills", name: "🎯 Навыки", icon: "💡" },
    { id: "dice", name: "🎲 Кубик", icon: "🎲" },
    { id: "reputation", name: "⭐ Репутация", icon: "⭐" },
    { id: "special", name: "🚀 Особые", icon: "🚀" }
];

// Символы для кубика
const DICE_SYMBOLS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
