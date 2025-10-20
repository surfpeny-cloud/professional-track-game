// Минимальный data.js для тестирования
console.log('📊 data.js загружен');

const GAME_CONFIG = {
    minPlayers: 2,
    maxPlayers: 6,
    startingReputation: 3
};

const PLAYER_COLORS = {
    red: { name: "Красный", emoji: "🔴", hex: "#ff6b6b" },
    blue: { name: "Синий", emoji: "🔵", hex: "#74b9ff" },
    green: { name: "Зеленый", emoji: "🟢", hex: "#00b894" },
    yellow: { name: "Желтый", emoji: "🟡", hex: "#fdcb6e" },
    purple: { name: "Фиолетовый", emoji: "🟣", hex: "#6c5ce7" },
    orange: { name: "Оранжевый", emoji: "🟠", hex: "#fd9644" }
};

const DICE_SYMBOLS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
