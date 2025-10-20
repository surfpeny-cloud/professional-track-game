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
    }

    // ===== ИСПРАВЛЕННАЯ ИНИЦИАЛИЗАЦИЯ =====
    initializeEventListeners() {
        console.log('🔄 Инициализация обработчиков событий...');
        
        // Основная кнопка добавления игрока
        const addPlayerBtn = document.getElementById('addPlayerBtn');
        if (addPlayerBtn) {
            addPlayerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🎯 Кнопка добавления нажата');
                this.addPlayer();
            });
        } else {
            console.error('❌ Кнопка addPlayerBtn не найдена');
        }

        // Ввод по Enter
        const playerNameInput = document.getElementById('playerNameInput');
        if (playerNameInput) {
            playerNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('⌨️ Enter нажат');
                    this.addPlayer();
                }
            });

            // Валидация в реальном времени
            playerNameInput.addEventListener('input', this.debounce(() => {
                this.validatePlayerName();
            }, 300));
        }

        // Остальные кнопки
        this.setupButton('startGameBtn', () => this.startGame());
        this.setupButton('rollBtn', () => this.rollDice());
        this.setupButton('nextPlayerBtn', () => this.nextPlayer());
        this.setupButton('successBtn', () => this.completeQuest(true));
        this.setupButton('failBtn', () => this.completeQuest(false));
        this.setupButton('shopBtn', () => this.openShop());
        this.setupButton('closeShopBtn', () => this.closeShop());
        this.setupButton('endGameBtn', () => this.endGame());
        this.setupButton('newGameBtn', () => this.newGame());

        // Модальные окна
        this.setupButton('modalCloseBtn', () => this.closeItemModal());
        
        const itemModal = document.getElementById('itemModal');
        if (itemModal) {
            itemModal.addEventListener('click', (e) => {
                if (e.target.id === 'itemModal') this.closeItemModal();
            });
        }

        console.log('✅ Все обработчики инициализированы');
    }

    setupButton(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', handler);
        } else {
            console.warn(`⚠️ Элемент ${elementId} не найден`);
        }
    }

    // ===== ИСПРАВЛЕННЫЙ МЕТОД ДОБАВЛЕНИЯ ИГРОКА =====
    addPlayer() {
        console.log('👤 Начало добавления игрока...');
        
        const nameInput = document.getElementById('playerNameInput');
        const colorSelect = document.getElementById('playerColorSelect');
        
        if (!nameInput || !colorSelect) {
            console.error('❌ Не найдены элементы формы');
            this.showNotification('Ошибка формы', 'error');
            return;
        }
        
        const name = nameInput.value.trim();
        const color = colorSelect.value;
        
        console.log(`📝 Данные: имя="${name}", цвет="${color}"`);
        
        // Валидация имени
        if (!name) {
            this.showNotification('Введите имя игрока', 'error');
            this.animateError(nameInput);
            return;
        }
        
        if (name.length < 2) {
            this.showNotification('Имя должно содержать минимум 2 символа', 'warning');
            this.animateError(nameInput);
            return;
        }
        
        if (name.length > 20) {
            this.showNotification('Имя не должно превышать 20 символов', 'warning');
            this.animateError(nameInput);
            return;
        }
        
        // Проверка лимита игроков
        if (this.players.length >= GAME_CONFIG.maxPlayers) {
            this.showNotification(`Максимум ${GAME_CONFIG.maxPlayers} игроков`, 'warning');
            return;
        }
        
        // Проверка уникальности имени
        if (this.players.some(player => player.name.toLowerCase() === name.toLowerCase())) {
            this.showNotification('Игрок с таким именем уже существует', 'error');
            this.animateError(nameInput);
            return;
        }
        
        // Создание игрока
        const player = {
            id: this.generateId(),
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
            maxSkills: 2
        };
        
        console.log('🎮 Создан новый игрок:', player);
        
        // Анимация добавления
        this.animatePlayerAddition(player);
        
        // Добавление в массив
        this.players.push(player);
        
        // Обновление интерфейса
        this.updatePlayersList();
        this.updateStartButton();
        
        // Сброс формы
        this.resetForm(nameInput, colorSelect);
        
        // Уведомление
        this.showNotification(`🎉 Игрок "${name}" добавлен!`, 'success');
        
        // Сохранение
        this.saveToStorage();
        
        console.log('✅ Игрок успешно добавлен');
    }

    animateError(element) {
        element.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }

    animatePlayerAddition(player) {
        const playersList = document.getElementById('playersList');
        
        // Убираем empty state если есть
        const emptyState = playersList.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                emptyState.remove();
            }, 300);
        }
        
        // Создаем временный элемент для анимации
        const tempElement = document.createElement('div');
        tempElement.className = `player-item ${player.color} adding`;
        tempElement.innerHTML = `
            <div class="player-info">
                <div class="player-color ${player.color}"></div>
                <span class="player-name">${player.name}</span>
            </div>
            <button class="remove-player" onclick="removePlayer('${player.id}')">×</button>
        `;
        
        playersList.appendChild(tempElement);
        
        // Запускаем анимацию
        setTimeout(() => {
            tempElement.classList.remove('adding');
            tempElement.style.animation = 'slideInRight 0.5s ease-out';
        }, 100);
    }

    resetForm(nameInput, colorSelect) {
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

    // ===== ОБНОВЛЕНИЕ СПИСКА ИГРОКОВ =====
    updatePlayersList() {
        const playersList = document.getElementById('playersList');
        const playerCount = document.getElementById('playerCount');
        
        if (!playersList || !playerCount) {
            console.error('❌ Не найдены элементы списка игроков');
            return;
        }
        
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
                <button class="remove-player" onclick="removePlayer('${player.id}')">×</button>
            </div>
        `).join('');
    }

    removePlayer(playerId) {
        console.log('🗑️ Удаление игрока:', playerId);
        
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return;
        
        const player = this.players[playerIndex];
        const playerElement = document.querySelector(`[onclick="removePlayer('${playerId}')"]`)?.closest('.player-item');
        
        if (playerElement) {
            // Анимация удаления
            playerElement.style.transform = 'translateX(100%)';
            playerElement.style.opacity = '0';
            
            setTimeout(() => {
                this.players.splice(playerIndex, 1);
                this.updatePlayersList();
                this.updateStartButton();
                this.showNotification(`Игрок "${player.name}" удален`, 'info');
                this.saveToStorage();
            }, 400);
        } else {
            // Без анимации
            this.players.splice(playerIndex, 1);
            this.updatePlayersList();
            this.updateStartButton();
            this.saveToStorage();
        }
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
    validatePlayerName() {
        const nameInput = document.getElementById('playerNameInput');
        if (!nameInput) return;
        
        const name = nameInput.value.trim();
        
        if (!name) {
            nameInput.style.borderColor = 'var(--glass-border)';
            return;
        }
        
        if (name.length < 2) {
            nameInput.style.borderColor = '#fdcb6e';
            nameInput.style.boxShadow = '0 0 0 3px rgba(253, 203, 110, 0.1)';
        } else if (this.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            nameInput.style.borderColor = '#ff7675';
            nameInput.style.boxShadow = '0 0 0 3px rgba(255, 118, 117, 0.1)';
        } else {
            nameInput.style.borderColor = '#00b894';
            nameInput.style.boxShadow = '0 0 0 3px rgba(0, 184, 148, 0.1)';
        }
    }

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

    generateId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showNotification(message, type = 'info') {
        // Создаем уведомление
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
        }, 3000);
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

    updateStartButton() {
        const startBtn = document.getElementById('startGameBtn');
        if (!startBtn) return;
        
        const isValid = this.players.length >= GAME_CONFIG.minPlayers;
        startBtn.disabled = !isValid;
        
        if (isValid) {
            startBtn.style.opacity = '1';
            startBtn.style.transform = 'scale(1)';
        } else {
            startBtn.style.opacity = '0.7';
            startBtn.style.transform = 'scale(0.98)';
        }
    }

    // ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM =====
    initializeTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.tg.ready();
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            
            console.log('✅ Telegram Web App инициализирован');
        }
    }

    // ===== СОХРАНЕНИЕ И ЗАГРУЗКА =====
    saveToStorage() {
        try {
            const gameData = {
                players: this.players,
                currentPlayerIndex: this.currentPlayerIndex,
                currentTurn: this.currentTurn,
                gameState: this.gameState,
                history: this.history,
                diceValue: this.diceValue,
                currentQuest: this.currentQuest,
                currentCellType: this.currentCellType,
                saveTime: new Date().toISOString()
            };
            
            localStorage.setItem('professionalTrackGame', JSON.stringify(gameData));
        } catch (e) {
            console.warn('⚠️ Не удалось сохранить игру:', e);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('professionalTrackGame');
            if (saved) {
                const gameData = JSON.parse(saved);
                
                this.players = gameData.players || [];
                this.currentPlayerIndex = gameData.currentPlayerIndex || 0;
                this.currentTurn = gameData.currentTurn || 1;
                this.gameState = gameData.gameState || 'setup';
                
                this.updatePlayersList();
                this.updateStartButton();
                
                console.log('💾 Игра загружена из сохранения');
            }
        } catch (e) {
            console.error('❌ Ошибка загрузки сохранения:', e);
        }
    }

    getRussianPlural(number, one, two, five) {
        let n = Math.abs(number);
        n %= 100;
        if (n >= 5 && n <= 20) return five;
        n %= 10;
        if (n === 1) return one;
        if (n >= 2 && n <= 4) return two;
        return five;
    }

    // Остальные методы игры...
    startGame() {
        if (this.players.length < GAME_CONFIG.minPlayers) {
            this.showNotification(`Нужно как минимум ${GAME_CONFIG.minPlayers} игрока`, 'warning');
            return;
        }
        
        this.gameState = 'playing';
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('gameInterface').style.display = 'block';
        
        this.showNotification('🎮 Игра началась!', 'success');
    }

    // ... остальные методы
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
let game;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Загрузка игры...');
    
    try {
        game = new ProfessionalTrackGame();
        console.log('✅ Игра успешно загружена');
        
        // Тестируем доступность элементов
        setTimeout(() => {
            const testElements = [
                'addPlayerBtn', 'playerNameInput', 'playerColorSelect', 
                'playersList', 'startGameBtn'
            ];
            
            testElements.forEach(id => {
                const element = document.getElementById(id);
                console.log(`🔍 ${id}:`, element ? '✅ Найден' : '❌ Не найден');
            });
        }, 100);
        
    } catch (error) {
        console.error('💥 Критическая ошибка при загрузке игры:', error);
        alert('Ошибка загрузки игры. Пожалуйста, обновите страницу.');
    }
});

// Глобальные функции для HTML
function removePlayer(playerId) {
    if (game && typeof game.removePlayer === 'function') {
        game.removePlayer(playerId);
    } else {
        console.error('❌ game.removePlayer не доступна');
    }
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
