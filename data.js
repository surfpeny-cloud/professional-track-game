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

// Символы для кубика
const DICE_SYMBOLS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
