// ===== ПРОСТАЯ РАБОЧАЯ ВЕРСИЯ GAME.JS =====
console.log('🎮 game.js загружается...');

class ProfessionalTrackGame {
    constructor() {
        console.log('🔄 Создание экземпляра игры...');
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentTurn = 1;
        this.gameState = 'setup';
        
        this.init();
    }

    init() {
        console.log('🚀 Инициализация игры...');
        this.bindEvents();
        this.loadFromStorage();
        this.updateUI();
        console.log('✅ Игра инициализирована');
    }

    bindEvents() {
        console.log('🔗 Привязка событий...');
        
        // Кнопка добавления игрока - САМАЯ ПРОСТАЯ ВЕРСИЯ
        const addBtn = document.getElementById('addPlayerBtn');
        if (addBtn) {
            console.log('✅ Кнопка добавления найдена');
            addBtn.addEventListener('click', () => {
                console.log('🎯 Кнопка нажата!');
                this.addPlayer();
            });
        } else {
            console.error('❌ Кнопка добавления не найдена!');
        }

        // Enter в поле ввода
        const nameInput = document.getElementById('playerNameInput');
        if (nameInput) {
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addPlayer();
                }
            });
        }

        // Остальные кнопки
        this.safeBind('startGameBtn', () => this.startGame());
        this.safeBind('rollBtn', () => this.rollDice());
        this.safeBind('nextPlayerBtn', () => this.nextPlayer());
        this.safeBind('successBtn', () => this.completeQuest(true));
        this.safeBind('failBtn', () => this.completeQuest(false));
    }

    safeBind(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', handler);
        }
    }

    // ===== ОСНОВНОЙ МЕТОД ДОБАВЛЕНИЯ ИГРОКА =====
    addPlayer() {
        console.log('👤 addPlayer() вызван');
        
        // Получаем элементы
        const nameInput = document.getElementById('playerNameInput');
        const colorSelect = document.getElementById('playerColorSelect');
        
        if (!nameInput || !colorSelect) {
            console.error('❌ Не найдены элементы формы');
            alert('Ошибка: форма не найдена');
            return;
        }

        const name = nameInput.value.trim();
        const color = colorSelect.value;

        console.log(`📝 Введенные данные: "${name}", цвет: ${color}`);

        // Простая валидация
        if (!name) {
            alert('Введите имя игрока');
            nameInput.focus();
            return;
        }

        if (this.players.length >= 6) {
            alert('Максимум 6 игроков');
            return;
        }

        // Проверка уникальности
        if (this.players.some(player => player.name.toLowerCase() === name.toLowerCase())) {
            alert('Игрок с таким именем уже существует');
            nameInput.focus();
            return;
        }

        // Создаем игрока
        const player = {
            id: Date.now().toString(),
            name: name,
            color: color,
            reputation: 3,
            level: 'intern',
            position: 0
        };

        console.log('🎮 Создан игрок:', player);

        // Добавляем в массив
        this.players.push(player);
        
        // Обновляем интерфейс
        this.updatePlayersList();
        this.updateStartButton();
        
        // Очищаем поле ввода
        nameInput.value = '';
        nameInput.focus();
        
        // Показываем уведомление
        this.showMessage(`Игрок "${name}" добавлен!`, 'success');
        
        // Сохраняем
        this.saveToStorage();

        console.log('✅ Игрок успешно добавлен. Всего игроков:', this.players.length);
    }

    updatePlayersList() {
        const playersList = document.getElementById('playersList');
        const playerCount = document.getElementById('playerCount');
        
        if (!playersList || !playerCount) {
            console.error('❌ Элементы списка не найдены');
            return;
        }

        // Обновляем счетчик
        playerCount.textContent = `${this.players.length} игроков`;

        // Обновляем список
        if (this.players.length === 0) {
            playersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <div class="empty-text">Пока нет игроков</div>
                    <div class="empty-subtext">Добавьте первого игрока чтобы начать</div>
                </div>
            `;
        } else {
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
    }

    removePlayer(playerId) {
        console.log('🗑️ Удаление игрока:', playerId);
        
        this.players = this.players.filter(player => player.id !== playerId);
        this.updatePlayersList();
        this.updateStartButton();
        this.saveToStorage();
        
        this.showMessage('Игрок удален', 'info');
    }

    updateStartButton() {
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.disabled = this.players.length < 2;
        }
    }

    updateUI() {
        this.updatePlayersList();
        this.updateStartButton();
    }

    showMessage(message, type = 'info') {
        // Простое уведомление
        console.log(`💬 ${type}: ${message}`);
        
        // Можно добавить красивый toast позже
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#00b894' : type === 'error' ? '#ff7675' : '#74b9ff'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    startGame() {
        if (this.players.length < 2) {
            this.showMessage('Нужно как минимум 2 игрока', 'error');
            return;
        }
        
        this.gameState = 'playing';
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('gameInterface').style.display = 'block';
        
        this.showMessage('Игра началась! 🎮', 'success');
    }

    rollDice() {
        this.showMessage('Бросок кубика! 🎲', 'info');
        // Реализуем позже
    }

    nextPlayer() {
        this.showMessage('Следующий игрок', 'info');
        // Реализуем позже
    }

    completeQuest(success) {
        this.showMessage(success ? 'Задание выполнено! ✅' : 'Задание провалено ❌', success ? 'success' : 'error');
        // Реализуем позже
    }

    saveToStorage() {
        try {
            const data = {
                players: this.players,
                gameState: this.gameState
            };
            localStorage.setItem('professionalTrackGame', JSON.stringify(data));
        } catch (e) {
            console.warn('Не удалось сохранить игру');
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('professionalTrackGame');
            if (saved) {
                const data = JSON.parse(saved);
                this.players = data.players || [];
                this.gameState = data.gameState || 'setup';
                console.log('💾 Загружено сохранение:', this.players.length, 'игроков');
            }
        } catch (e) {
            console.warn('Ошибка загрузки сохранения');
        }
    }
}

// ===== ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ =====
let game;

// Ждем полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏁 DOM загружен, запускаем игру...');
    
    try {
        game = new ProfessionalTrackGame();
        console.log('🎉 Игра успешно запущена!');
        console.log('📍 game доступен глобально:', typeof game !== 'undefined');
        
        // Тестируем доступ к кнопке через глобальную переменную
        window.testGame = function() {
            console.log('🧪 Тест: game.addPlayer()', typeof game.addPlayer);
            game.addPlayer();
        };
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
        alert('Ошибка загрузки игры: ' + error.message);
    }
});

// Делаем game глобально доступным для HTML onclick
window.game = null;

// Обновляем глобальную переменную после загрузки
setTimeout(() => {
    window.game = game;
    console.log('🌐 game установлен глобально:', !!window.game);
}, 100);
