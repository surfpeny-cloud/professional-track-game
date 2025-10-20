// ===== PREMIUM GAME CLASS =====
class ProfessionalTrackGame {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentTurn = 1;
        this.gameState = 'setup';
        this.history = [];
        this.diceValue = 0;
        this.currentQuest = null;
        this.currentCellType = null;
        this.telegramUser = null;
        this.isRolling = false;
        
        this.initializeEventListeners();
        this.initializeTelegram();
        this.loadFromStorage();
        this.setupPremiumFeatures();
    }

    // ===== PREMIUM INITIALIZATION =====
    initializeTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.tg.ready();
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            
            const user = this.tg.initDataUnsafe?.user;
            if (user) {
                this.telegramUser = user;
                console.log('🎯 Premium User:', user);
            }
            
            this.tg.setHeaderColor('#6c5ce7');
            this.tg.setBackgroundColor('#0a0a1a');
        }
    }

    setupPremiumFeatures() {
        // Добавляем премиум функционал
        this.setupSmoothAnimations();
        this.setupHapticFeedback();
        this.setupAudioFeedback();
    }

    setupSmoothAnimations() {
        // Включаем плавные анимации для всех элементов
        document.documentElement.style.setProperty('--transition', 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)');
    }

    setupHapticFeedback() {
        // Вибрационная отдача для мобильных устройств
        this.hapticAvailable = 'vibrate' in navigator;
    }

    setupAudioFeedback() {
        // Простая аудио-система для премиум ощущений
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio context not supported');
        }
    }

    // ===== PREMIUM EVENT LISTENERS =====
    initializeEventListeners() {
        // Кнопка добавления игрока с улучшенной обработкой
        document.getElementById('addPlayerBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.addPlayer();
        });
        
        // Улучшенный ввод с дебаунсингом
        const nameInput = document.getElementById('playerNameInput');
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addPlayer();
            }
        });

        // Плавная валидация в реальном времени
        nameInput.addEventListener('input', this.debounce(() => {
            this.validatePlayerName();
        }, 300));

        // Остальные обработчики
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('rollBtn').addEventListener('click', () => this.rollDice());
        document.getElementById('nextPlayerBtn').addEventListener('click', () => this.nextPlayer());
        document.getElementById('successBtn').addEventListener('click', () => this.completeQuest(true));
        document.getElementById('failBtn').addEventListener('click', () => this.completeQuest(false));
        document.getElementById('shopBtn').addEventListener('click', () => this.openShop());
        document.getElementById('closeShopBtn').addEventListener('click', () => this.closeShop());
        document.getElementById('endGameBtn').addEventListener('click', () => this.endGame());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());

        // Модальные окна
        document.getElementById('modalCloseBtn').addEventListener('click', () => this.closeItemModal());
        document.getElementById('itemModal').addEventListener('click', (e) => {
            if (e.target.id === 'itemModal') this.closeItemModal();
        });
    }

    // ===== PREMIUM PLAYER MANAGEMENT =====
    addPlayer() {
        const nameInput = document.getElementById('playerNameInput');
        const colorSelect = document.getElementById('playerColorSelect');
        
        const name = nameInput.value.trim();
        const color = colorSelect.value;
        
        // Премиум валидация
        if (!this.validatePlayerName(name)) return;
        
        if (this.players.length >= GAME_CONFIG.maxPlayers) {
            this.showPremiumNotification(`Достигнут лимит в ${GAME_CONFIG.maxPlayers} игроков`, 'warning');
            this.playHapticFeedback('error');
            return;
        }
        
        // Проверка уникальности с учетом регистра
        const nameExists = this.players.some(player => 
            player.name.toLowerCase() === name.toLowerCase()
        );
        
        if (nameExists) {
            this.showPremiumNotification('Игрок с таким именем уже существует', 'error');
            this.playHapticFeedback('error');
            return;
        }
        
        // Создание премиум игрока
        const player = {
            id: this.generatePremiumId(),
            name: name,
            color: color,
            reputation: GAME_CONFIG.startingReputation,
            level: 'intern',
            skills: [],
            inventory: [],
            position: 0,
            turns: 0,
            completedQuests: 0,
            failedQuests: 0,
            maxSkills: 2,
            joinTime: new Date().toISOString(),
            achievements: []
        };
        
        // Анимация добавления
        this.animatePlayerAddition(player);
        
        this.players.push(player);
        this.updatePlayersList();
        this.updateStartButton();
        
        // Премиум сброс формы
        this.resetFormWithAnimation(nameInput, colorSelect);
        
        this.showPremiumNotification(`🎉 Игрок ${name} добавлен!`, 'success');
        this.playHapticFeedback('success');
        this.saveToStorage();
    }

    validatePlayerName(name = '') {
        const nameInput = document.getElementById('playerNameInput');
        
        if (!name.trim()) {
            nameInput.style.borderColor = '#ff7675';
            nameInput.style.boxShadow = '0 0 0 3px rgba(255, 118, 117, 0.1)';
            return false;
        }
        
        if (name.length < 2) {
            nameInput.style.borderColor = '#fdcb6e';
            nameInput.style.boxShadow = '0 0 0 3px rgba(253, 203, 110, 0.1)';
            return false;
        }
        
        if (name.length > 20) {
            nameInput.style.borderColor = '#fdcb6e';
            nameInput.style.boxShadow = '0 0 0 3px rgba(253, 203, 110, 0.1)';
            return false;
        }
        
        // Валидное имя
        nameInput.style.borderColor = '#00b894';
        nameInput.style.boxShadow = '0 0 0 3px rgba(0, 184, 148, 0.1)';
        return true;
    }

    animatePlayerAddition(player) {
        const playersList = document.getElementById('playersList');
        const tempElement = document.createElement('div');
        tempElement.className = `player-item ${player.color} adding`;
        tempElement.innerHTML = `
            <div class="player-info">
                <div class="player-color ${player.color}"></div>
                <span class="player-name">${player.name}</span>
            </div>
            <div class="adding-spinner">⏳</div>
        `;
        
        playersList.appendChild(tempElement);
        
        // Анимация появления
        setTimeout(() => {
            tempElement.classList.remove('adding');
            tempElement.classList.add('added');
        }, 100);
    }

    resetFormWithAnimation(nameInput, colorSelect) {
        // Анимация очистки
        nameInput.style.transform = 'scale(0.95)';
        nameInput.style.opacity = '0.7';
        
        setTimeout(() => {
            nameInput.value = '';
            nameInput.style.borderColor = 'var(--glass-border)';
            nameInput.style.boxShadow = 'none';
            nameInput.style.transform = 'scale(1)';
            nameInput.style.opacity = '1';
            nameInput.focus();
        }, 300);
    }

    removePlayer(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return;
        
        const player = this.players[playerIndex];
        
        // Анимация удаления
        const playerElement = document.querySelector(`[onclick="game.removePlayer('${playerId}')"]`).closest('.player-item');
        if (playerElement) {
            playerElement.style.transform = 'translateX(100%)';
            playerElement.style.opacity = '0';
            
            setTimeout(() => {
                this.players.splice(playerIndex, 1);
                this.updatePlayersList();
                this.updateStartButton();
                this.showPremiumNotification(`Игрок ${player.name} удален`, 'info');
                this.saveToStorage();
            }, 400);
        }
    }

    // ===== PREMIUM DICE ROLLING =====
    async rollDice() {
        if (this.isRolling) return;
        
        const dice = document.getElementById('dice');
        const rollBtn = document.getElementById('rollBtn');
        const diceNumber = document.getElementById('diceNumber');
        
        this.isRolling = true;
        rollBtn.disabled = true;
        this.playHapticFeedback('medium');
        
        // Премиум анимация броска
        dice.classList.add('rolling');
        
        // Интенсивная анимация с множеством вращений
        const rolls = 15;
        for (let i = 0; i < rolls; i++) {
            const randomValue = Math.floor(Math.random() * 6) + 1;
            diceNumber.textContent = DICE_SYMBOLS[randomValue - 1];
            dice.style.transform = `rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg) scale(${1 + Math.random() * 0.2})`;
            
            await this.sleep(50 + (i * 5)); // Ускоряемся к концу
        }
        
        // Финальное значение
        this.diceValue = Math.floor(Math.random() * 6) + 1;
        diceNumber.textContent = DICE_SYMBOLS[this.diceValue - 1];
        
        // Завершение с стилем
        setTimeout(() => {
            dice.classList.remove('rolling');
            dice.style.transform = 'rotateX(0) rotateY(0) scale(1)';
            rollBtn.disabled = false;
            this.isRolling = false;
            
            this.determineCellType();
            this.showDiceResult();
            this.playHapticFeedback('success');
            
        }, 500);
    }

    showDiceResult() {
        const diceResult = document.getElementById('diceResult');
        diceResult.innerHTML = `
            <span class="result-icon">🎯</span>
            <span class="result-text">Результат: ${this.diceValue}</span>
            <span class="result-badge">${this.getDiceResultText()}</span>
        `;
        
        diceResult.style.animation = 'none';
        setTimeout(() => {
            diceResult.style.animation = 'fadeIn 0.5s ease-out';
        }, 10);
        
        this.addHistoryMessage(
            `${this.getCurrentPlayer().name} выбросил ${this.diceValue}`
        );
    }

    getDiceResultText() {
        const texts = {
            1: 'Старт!', 2: 'Хорошо!', 3: 'Отлично!', 
            4: 'Великолепно!', 5: 'Потрясающе!', 6: 'Идеально!'
        };
        return texts[this.diceValue] || 'Удача!';
    }

    // ===== PREMIUM GAME FLOW =====
    startGame() {
        if (this.players.length < GAME_CONFIG.minPlayers) {
            this.showPremiumNotification(`Нужно как минимум ${GAME_CONFIG.minPlayers} игрока`, 'warning');
            return;
        }
        
        // Анимация перехода
        this.animateScreenTransition('setupSection', 'gameInterface', () => {
            this.gameState = 'playing';
            this.currentPlayerIndex = 0;
            this.currentTurn = 1;
            this.history = [];
            
            this.updateGameInterface();
            this.addHistoryMessage('🎮 Игра началась! Удачи всем игрокам!');
            
            this.showPremiumNotification('Игра началась! 🚀', 'success');
            this.playHapticFeedback('heavy');
            this.saveToStorage();
        });
    }

    animateScreenTransition(hideId, showId, callback) {
        const hideElement = document.getElementById(hideId);
        const showElement = document.getElementById(showId);
        
        hideElement.style.animation = 'fadeOut 0.5s ease-out forwards';
        
        setTimeout(() => {
            hideElement.style.display = 'none';
            showElement.style.display = 'block';
            showElement.style.animation = 'fadeInUp 0.6s ease-out forwards';
            
            if (callback) setTimeout(callback, 300);
        }, 300);
    }

    completeQuest(success) {
        const player = this.getCurrentPlayer();
        const questCard = document.querySelector('.quest-card');
        
        // Анимация выполнения
        questCard.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            if (success) {
                const reputationGain = this.calculateReputationGain();
                player.reputation += reputationGain;
                player.completedQuests++;
                
                this.showPremiumNotification(
                    `✅ Успех! +${reputationGain} репутации!`, 
                    'success'
                );
                this.animateReputationGain(reputationGain);
                
                this.addHistoryMessage(
                    `${player.name} успешно выполнил задание и получил +${reputationGain} репутации`
                );
            } else {
                player.reputation = Math.max(0, player.reputation - 1);
                player.failedQuests++;
                
                this.showPremiumNotification('❌ Задание не выполнено', 'error');
                this.addHistoryMessage(`${player.name} не справился с заданием`);
            }
            
            this.checkLevelUp(player);
            questCard.style.transform = 'scale(1)';
            document.getElementById('completionButtons').style.display = 'none';
            this.updateGameInterface();
            this.saveToStorage();
            
        }, 300);
    }

    animateReputationGain(amount) {
        const reputationElement = document.getElementById('currentPlayerReputation');
        const originalRep = parseInt(reputationElement.textContent);
        const newRep = originalRep + amount;
        
        let current = originalRep;
        const increment = () => {
            if (current < newRep) {
                current++;
                reputationElement.textContent = current;
                reputationElement.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    reputationElement.style.transform = 'scale(1)';
                }, 150);
                setTimeout(increment, 100);
            }
        };
        increment();
    }

    // ===== PREMIUM UTILITIES =====
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    generatePremiumId() {
        return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    playHapticFeedback(type) {
        if (!this.hapticAvailable || !this.tg?.isVersionAtLeast('6.1')) return;
        
        const patterns = {
            light: [50],
            medium: [100],
            heavy: [200],
            success: [50, 50, 50],
            error: [150, 50, 150]
        };
        
        if (patterns[type]) {
            navigator.vibrate(patterns[type]);
        }
    }

    showPremiumNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-text">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое удаление
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===== PREMIUM PERSISTENCE =====
    saveToStorage() {
        const gameData = {
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            currentTurn: this.currentTurn,
            gameState: this.gameState,
            history: this.history,
            diceValue: this.diceValue,
            currentQuest: this.currentQuest,
            currentCellType: this.currentCellType,
            saveTime: new Date().toISOString(),
            version: 'premium_1.0'
        };
        
        try {
            localStorage.setItem('professionalTrackGame', JSON.stringify(gameData));
        } catch (e) {
            console.warn('Could not save game data:', e);
        }
    }

    loadFromStorage() {
        const saved = localStorage.getItem('professionalTrackGame');
        if (saved) {
            try {
                const gameData = JSON.parse(saved);
                
                // Миграция данных если нужно
                if (this.migrateSaveData(gameData)) {
                    this.players = gameData.players || [];
                    this.currentPlayerIndex = gameData.currentPlayerIndex || 0;
                    this.currentTurn = gameData.currentTurn || 1;
                    this.gameState = gameData.gameState || 'setup';
                    this.history = gameData.history || [];
                    this.diceValue = gameData.diceValue || 0;
                    this.currentQuest = gameData.currentQuest || null;
                    this.currentCellType = gameData.currentCellType || null;
                    
                    this.restoreGameState();
                    console.log('🎮 Premium game loaded successfully');
                }
                
            } catch (e) {
                console.error('Error loading saved game:', e);
                this.showPremiumNotification('Ошибка загрузки сохранения', 'error');
            }
        }
    }

    migrateSaveData(gameData) {
        // Миграция старых сохранений
        if (!gameData.version) {
            // Конвертация из старого формата
            gameData.version = 'premium_1.0';
        }
        return true;
    }

    restoreGameState() {
        switch (this.gameState) {
            case 'playing':
                document.getElementById('setupSection').style.display = 'none';
                document.getElementById('gameInterface').style.display = 'block';
                this.updateGameInterface();
                break;
            case 'ended':
                document.getElementById('setupSection').style.display = 'none';
                document.getElementById('gameInterface').style.display = 'none';
                document.getElementById('resultsSection').style.display = 'block';
                this.showResults();
                break;
            default:
                this.updatePlayersList();
                this.updateStartButton();
        }
    }

    // Остальные методы остаются премиум-версиями базовых функций
    updatePlayersList() {
        const playersList = document.getElementById('playersList');
        const playerCount = document.getElementById('playerCount');
        
        playerCount.textContent = `${this.players.length} игрок${this.getRussianPlural(this.players.length, '', 'а', 'ов')}`;
        
        if (this.players.length === 0) {
            playersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <div class="empty-text">Пока нет игроков</div>
                    <div class="empty-subtext">Добавьте первого игрока чтобы начать</div>
                </div>
            `;
            return;
        }
        
        playersList.innerHTML = this.players.map(player => `
            <div class="player-item ${player.color}">
                <div class="player-info">
                    <div class="player-color ${player.color}"></div>
                    <span class="player-name">${player.name}</span>
                </div>
                <button class="remove-player" onclick="game.removePlayer('${player.id}')">×</button>
            </div>
        `).join('');
    }

    updateStartButton() {
        const startBtn = document.getElementById('startGameBtn');
        const isValid = this.players.length >= GAME_CONFIG.minPlayers;
        startBtn.disabled = !isValid;
    }

    determineCellType() {
        const types = ['green', 'green', 'blue', 'blue', 'yellow', 'purple'];
        this.currentCellType = types[this.diceValue - 1];
        this.showQuest(this.currentCellType);
    }

    showQuest(cellType) {
        // ... премиум реализация показа заданий
        const quests = QUESTS[cellType];
        const randomQuest = quests[Math.floor(Math.random() * quests.length)];
        this.currentQuest = randomQuest;
        
        // Анимированное обновление интерфейса
        this.animateQuestDisplay(randomQuest, cellType);
    }

    animateQuestDisplay(quest, cellType) {
        const cellInfo = CELL_TYPES[cellType];
        const cellDisplay = document.getElementById('cellDisplay');
        
        // Анимация появления
        cellDisplay.style.animation = 'fadeOut 0.3s ease-out forwards';
        
        setTimeout(() => {
            cellDisplay.className = `cell-display ${cellInfo.colorClass}`;
            document.getElementById('cellIcon').textContent = cellInfo.emoji;
            document.getElementById('cellType').textContent = cellInfo.name;
            document.getElementById('cellDescription').textContent = cellInfo.description;
            
            document.getElementById('currentQuest').textContent = quest.description;
            document.getElementById('instructionsText').innerHTML = quest.instructions
                .map(inst => `<div class="instruction-item">${inst}</div>`)
                .join('');
            document.getElementById('rewardsText').innerHTML = quest.rewards
                .map(reward => `<div class="reward-item">${reward}</div>`)
                .join('');
                
            cellDisplay.style.animation = 'fadeIn 0.3s ease-out forwards';
            document.getElementById('completionButtons').style.display = 'grid';
        }, 300);
    }

    // ... остальные методы с премиум улучшениями

    getRussianPlural(number, one, two, five) {
        let n = Math.abs(number);
        n %= 100;
        if (n >= 5 && n <= 20) return five;
        n %= 10;
        if (n === 1) return one;
        if (n >= 2 && n <= 4) return two;
        return five;
    }
}

// ===== PREMIUM INITIALIZATION =====
let game;

document.addEventListener('DOMContentLoaded', () => {
    // Показываем загрузочный экран
    document.body.style.opacity = '0';
    
    setTimeout(() => {
        game = new ProfessionalTrackGame();
        document.body.style.opacity = '1';
        document.body.style.transition = 'opacity 0.5s ease-out';
        
        console.log('🎮 Premium Professional Track Game initialized');
    }, 100);
});

// Глобальные функции для HTML
function removePlayer(playerId) {
    if (game) game.removePlayer(playerId);
}

function selectShopCategory(categoryId) {
    if (game) game.selectShopCategory(categoryId);
}

function buyItem(categoryId, itemId) {
    if (game) game.buyItem(categoryId, itemId);
}

function showItemInfo(categoryId, itemId) {
    if (game) game.showItemInfo(categoryId, itemId);
}
