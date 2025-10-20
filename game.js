// Основной игровой класс
class ProfessionalTrackGame {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentTurn = 1;
        this.gameState = 'setup'; // setup, playing, ended
        this.history = [];
        this.diceValue = 0;
        this.currentQuest = null;
        this.currentCellType = null;
        this.telegramUser = null;
        
        this.initializeEventListeners();
        this.initializeTelegram();
        this.loadFromStorage();
    }

    // Инициализация Telegram Web App
    initializeTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            
            // Используем данные пользователя Telegram
            const user = this.tg.initDataUnsafe?.user;
            if (user) {
                this.telegramUser = user;
                console.log('Telegram user:', user);
            }
            
            // Настройка интерфейса под Telegram
            this.tg.setHeaderColor('#6c5ce7');
            this.tg.setBackgroundColor('#1a1a2e');
        }
    }

    // Инициализация обработчиков событий
    initializeEventListeners() {
        // Кнопка добавления игрока
        document.getElementById('addPlayerBtn').addEventListener('click', () => this.addPlayer());
        
        // Кнопка начала игры
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        
        // Кнопка броска кубика
        document.getElementById('rollBtn').addEventListener('click', () => this.rollDice());
        
        // Кнопка следующего игрока
        document.getElementById('nextPlayerBtn').addEventListener('click', () => this.nextPlayer());
        
        // Кнопки выполнения задания
        document.getElementById('successBtn').addEventListener('click', () => this.completeQuest(true));
        document.getElementById('failBtn').addEventListener('click', () => this.completeQuest(false));
        
        // Кнопки магазина
        document.getElementById('shopBtn').addEventListener('click', () => this.openShop());
        document.getElementById('closeShopBtn').addEventListener('click', () => this.closeShop());
        
        // Кнопка завершения игры
        document.getElementById('endGameBtn').addEventListener('click', () => this.endGame());
        
        // Кнопка новой игры
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        
        // Ввод имени игрока по Enter
        document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayer();
        });

        // Закрытие модального окна магазина
        document.getElementById('modalCloseBtn').addEventListener('click', () => {
            this.closeItemModal();
        });

        // Закрытие модального окна по клику вне его
        document.getElementById('itemModal').addEventListener('click', (e) => {
            if (e.target.id === 'itemModal') {
                this.closeItemModal();
            }
        });
    }

    // Добавление игрока
    addPlayer() {
        const nameInput = document.getElementById('playerNameInput');
        const colorSelect = document.getElementById('playerColorSelect');
        
        const name = nameInput.value.trim();
        const color = colorSelect.value;
        
        if (!name) {
            this.showNotification('Введите имя игрока', 'error');
            return;
        }
        
        if (this.players.length >= GAME_CONFIG.maxPlayers) {
            this.showNotification(`Максимум ${GAME_CONFIG.maxPlayers} игроков`, 'error');
            return;
        }
        
        // Проверка уникальности имени
        if (this.players.some(player => player.name.toLowerCase() === name.toLowerCase())) {
            this.showNotification('Игрок с таким именем уже существует', 'error');
            return;
        }
        
        const player = {
            id: Date.now().toString(),
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
            maxSkills: 2 // Начальное количество слотов для навыков
        };
        
        this.players.push(player);
        this.updatePlayersList();
        this.updateStartButton();
        
        // Очистка поля ввода
        nameInput.value = '';
        nameInput.focus();
        
        this.showNotification(`Игрок ${name} добавлен!`, 'success');
        this.saveToStorage();
    }

    // Обновление списка игроков
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

    // Удаление игрока
    removePlayer(playerId) {
        this.players = this.players.filter(player => player.id !== playerId);
        this.updatePlayersList();
        this.updateStartButton();
        this.saveToStorage();
    }

    // Обновление кнопки начала игры
    updateStartButton() {
        const startBtn = document.getElementById('startGameBtn');
        const isValid = this.players.length >= GAME_CONFIG.minPlayers && 
                       this.players.length <= GAME_CONFIG.maxPlayers;
        
        startBtn.disabled = !isValid;
    }

    // Начало игры
    startGame() {
        if (this.players.length < GAME_CONFIG.minPlayers) {
            this.showNotification(`Нужно как минимум ${GAME_CONFIG.minPlayers} игрока`, 'error');
            return;
        }
        
        this.gameState = 'playing';
        this.currentPlayerIndex = 0;
        this.currentTurn = 1;
        this.history = [];
        
        // Переключение интерфейсов
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('gameInterface').style.display = 'block';
        
        this.updateGameInterface();
        this.addHistoryMessage(HISTORY_MESSAGES.game_start);
        
        this.showNotification('Игра началась! Удачи!', 'success');
        this.saveToStorage();
    }

    // Бросок кубика
    async rollDice() {
        const dice = document.getElementById('dice');
        const rollBtn = document.getElementById('rollBtn');
        const diceNumber = document.getElementById('diceNumber');
        const diceResult = document.getElementById('diceResult');
        
        // Блокируем кнопку на время анимации
        rollBtn.disabled = true;
        
        // Анимация броска
        dice.classList.add('rolling');
        
        // Случайные значения во время анимации
        for (let i = 0; i < 10; i++) {
            const randomValue = Math.floor(Math.random() * 6) + 1;
            diceNumber.textContent = DICE_SYMBOLS[randomValue - 1];
            await this.sleep(100);
        }
        
        // Финальное значение
        this.diceValue = Math.floor(Math.random() * 6) + 1;
        diceNumber.textContent = DICE_SYMBOLS[this.diceValue - 1];
        
        // Завершение анимации
        setTimeout(() => {
            dice.classList.remove('rolling');
            rollBtn.disabled = false;
            
            // Определение типа клетки
            this.determineCellType();
            
            // Показываем результат
            diceResult.innerHTML = `
                <span class="result-icon">📊</span>
                <span class="result-text">Результат: ${this.diceValue}</span>
            `;
            
            // Добавляем в историю
            this.addHistoryMessage(
                this.getCurrentPlayer().name + HISTORY_MESSAGES.dice_roll + this.diceValue
            );
            
            this.saveToStorage();
        }, 500);
    }

    // Определение типа клетки по броску кубика
    determineCellType() {
        let cellType;
        
        if (this.diceValue <= 2) {
            cellType = 'green'; // Профессиональный рост
        } else if (this.diceValue <= 4) {
            cellType = 'blue'; // Командная работа
        } else if (this.diceValue === 5) {
            cellType = 'yellow'; // Кризис и возможности
        } else {
            cellType = 'purple'; // Особые возможности
        }
        
        this.currentCellType = cellType;
        this.showQuest(cellType);
    }

    // Показ задания
    showQuest(cellType) {
        const cellTypeInfo = CELL_TYPES[cellType];
        const quests = QUESTS[cellType];
        const randomQuest = quests[Math.floor(Math.random() * quests.length)];
        
        this.currentQuest = randomQuest;
        
        // Обновляем отображение клетки
        const cellDisplay = document.getElementById('cellDisplay');
        const cellIcon = document.getElementById('cellIcon');
        const cellTypeElem = document.getElementById('cellType');
        const cellDescription = document.getElementById('cellDescription');
        const cellPosition = document.getElementById('cellPosition');
        
        cellDisplay.className = `cell-display ${cellTypeInfo.colorClass}`;
        cellIcon.textContent = cellTypeInfo.emoji;
        cellTypeElem.textContent = cellTypeInfo.name;
        cellDescription.textContent = cellTypeInfo.description;
        
        // Обновляем позицию игрока
        const currentPlayer = this.getCurrentPlayer();
        currentPlayer.position += this.diceValue;
        cellPosition.textContent = `Позиция: ${currentPlayer.position}`;
        
        // Обновляем отображение задания
        const currentQuestElem = document.getElementById('currentQuest');
        const questDifficulty = document.getElementById('questDifficulty');
        const instructionsText = document.getElementById('instructionsText');
        const rewardsText = document.getElementById('rewardsText');
        const completionButtons = document.getElementById('completionButtons');
        
        currentQuestElem.textContent = randomQuest.description;
        
        // Сложность задания
        const difficulty = DIFFICULTIES[randomQuest.difficulty];
        questDifficulty.innerHTML = `
            <span class="difficulty-icon">${difficulty.emoji}</span>
            <span class="difficulty-text ${difficulty.color}">Сложность: ${difficulty.name}</span>
        `;
        
        // Инструкции
        instructionsText.innerHTML = randomQuest.instructions
            .map(instruction => `<div class="instruction-item">${instruction}</div>`)
            .join('');
        
        // Награды
        rewardsText.innerHTML = randomQuest.rewards
            .map(reward => `<div class="reward-item">${reward}</div>`)
            .join('');
        
        // Показываем кнопки выполнения
        completionButtons.style.display = 'grid';
        
        // Добавляем в историю
        this.addHistoryMessage(
            this.getCurrentPlayer().name + HISTORY_MESSAGES.quest_start + randomQuest.title
        );
        
        this.saveToStorage();
    }

    // Завершение задания
    completeQuest(success) {
        const player = this.getCurrentPlayer();
        
        if (success) {
            // Награда за успех
            const reputationGain = this.calculateReputationGain();
            player.reputation += reputationGain;
            
            this.addHistoryMessage(
                player.name + HISTORY_MESSAGES.quest_success + 
                HISTORY_MESSAGES.reputation_gain.replace('{amount}', reputationGain)
            );
            
            player.completedQuests++;
            this.showNotification(`Отлично! +${reputationGain} репутации!`, 'success');
        } else {
            // Штраф за провал
            player.reputation = Math.max(0, player.reputation - 1);
            
            this.addHistoryMessage(player.name + HISTORY_MESSAGES.quest_fail);
            player.failedQuests++;
            this.showNotification('Попробуйте в следующий раз!', 'warning');
        }
        
        // Проверяем повышение уровня
        this.checkLevelUp(player);
        
        // Скрываем кнопки выполнения
        document.getElementById('completionButtons').style.display = 'none';
        
        // Обновляем интерфейс
        this.updateGameInterface();
        this.saveToStorage();
    }

    // Расчет награды за задание
    calculateReputationGain() {
        if (!this.currentQuest) return 2;
        
        const baseReward = {
            easy: 1,
            medium: 2,
            hard: 3,
            epic: 5
        }[this.currentQuest.difficulty];
        
        return baseReward;
    }

    // Проверка повышения уровня
    checkLevelUp(player) {
        const levels = Object.entries(CAREER_LEVELS);
        
        for (let i = levels.length - 1; i >= 0; i--) {
            const [levelKey, level] = levels[i];
            if (player.reputation >= level.reputation && player.level !== levelKey) {
                player.level = levelKey;
                this.addHistoryMessage(
                    player.name + HISTORY_MESSAGES.level_up + level.name
                );
                this.showNotification(`Поздравляем! Новый уровень: ${level.name}`, 'success');
                break;
            }
        }
    }

    // Следующий игрок
    nextPlayer() {
        // Переходим к следующему игроку
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // Если все игроки сделали ход, увеличиваем номер хода
        if (this.currentPlayerIndex === 0) {
            this.currentTurn++;
            
            // Проверяем условие окончания игры
            if (this.currentTurn > GAME_CONFIG.maxTurns || 
                this.players.some(player => player.reputation >= GAME_CONFIG.victoryReputation)) {
                this.endGame();
                return;
            }
        }
        
        // Сбрасываем состояние
        this.diceValue = 0;
        this.currentQuest = null;
        this.currentCellType = null;
        
        // Обновляем интерфейс
        this.updateGameInterface();
        
        // Сбрасываем отображение кубика и задания
        document.getElementById('diceNumber').textContent = '?';
        document.getElementById('diceResult').innerHTML = `
            <span class="result-icon">📊</span>
            <span class="result-text">Результат: -</span>
        `;
        
        document.getElementById('completionButtons').style.display = 'none';
        
        // Сбрасываем отображение клетки
        const cellDisplay = document.getElementById('cellDisplay');
        cellDisplay.className = 'cell-display';
        document.getElementById('cellIcon').textContent = '🎯';
        document.getElementById('cellType').textContent = 'Тип задания';
        document.getElementById('cellDescription').textContent = 'Бросьте кубик для определения типа задания';
        document.getElementById('cellPosition').textContent = 'Позиция: -';
        
        // Сбрасываем отображение задания
        document.getElementById('currentQuest').textContent = 'Бросьте кубик для получения задания!';
        document.getElementById('instructionsText').innerHTML = '<div class="empty-instruction">-</div>';
        document.getElementById('rewardsText').innerHTML = '<div class="empty-reward">-</div>';
        
        this.addHistoryMessage(this.getCurrentPlayer().name + HISTORY_MESSAGES.player_turn);
        this.saveToStorage();
    }

    // Обновление игрового интерфейса
    updateGameInterface() {
        const currentPlayer = this.getCurrentPlayer();
        
        // Текущий игрок
        document.getElementById('currentPlayerName').textContent = currentPlayer.name;
        document.getElementById('currentPlayerReputation').textContent = currentPlayer.reputation;
        document.getElementById('currentPlayerLevel').textContent = CAREER_LEVELS[currentPlayer.level].name;
        
        // Аватар игрока
        const avatar = document.getElementById('currentPlayerAvatar');
        avatar.innerHTML = `<span class="avatar-emoji">${PLAYER_COLORS[currentPlayer.color].emoji}</span>`;
        
        // Статус игры
        document.getElementById('currentTurn').textContent = this.currentTurn;
        document.getElementById('totalPlayers').textContent = this.players.length;
        
        // Таблица игроков
        this.updatePlayersTable();
        
        // История
        this.updateHistory();
        
        // Обновляем текущий шаг в заголовке
        document.getElementById('currentStep').textContent = 
            `Ход ${this.currentTurn} • ${currentPlayer.name}`;
    }

    // Обновление таблицы игроков
    updatePlayersTable() {
        const playersTable = document.getElementById('playersTable');
        
        // Сортируем игроков по репутации
        const sortedPlayers = [...this.players].sort((a, b) => b.reputation - a.reputation);
        
        playersTable.innerHTML = `
            <div class="table-header">
                <div class="table-cell">#</div>
                <div class="table-cell">Игрок</div>
                <div class="table-cell">Уровень</div>
                <div class="table-cell">Репутация</div>
            </div>
            ${sortedPlayers.map((player, index) => `
                <div class="table-row ${player.id === this.getCurrentPlayer().id ? 'current-turn' : ''}">
                    <div class="table-cell">${index + 1}</div>
                    <div class="table-cell">
                        <div class="player-color-small ${player.color}"></div>
                        ${player.name}
                    </div>
                    <div class="table-cell">${CAREER_LEVELS[player.level].name}</div>
                    <div class="table-cell">${player.reputation} ⭐</div>
                </div>
            `).join('')}
        `;
    }

    // Обновление истории
    updateHistory() {
        const historyElem = document.getElementById('history');
        
        if (this.history.length === 0) {
            historyElem.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">История пока пуста</div>
                    <div class="empty-subtext">Здесь будут отображаться действия игроков</div>
                </div>
            `;
            return;
        }
        
        historyElem.innerHTML = this.history
            .slice(-10) // Последние 10 записей
            .reverse() // Новые сверху
            .map(entry => `
                <div class="history-item ${this.players.find(p => p.name === entry.player)?.color || ''}">
                    <div class="history-content">${entry.message}</div>
                    <div class="history-time">${entry.time}</div>
                </div>
            `)
            .join('');
    }

    // Добавление сообщения в историю
    addHistoryMessage(message) {
        const player = this.getCurrentPlayer();
        this.history.push({
            player: player.name,
            message: message,
            time: new Date().toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        });
        
        // Ограничиваем размер истории
        if (this.history.length > 50) {
            this.history = this.history.slice(-50);
        }
    }

    // Магазин
    openShop() {
        document.getElementById('shopSection').style.display = 'block';
        this.renderShop();
    }

    closeShop() {
        document.getElementById('shopSection').style.display = 'none';
    }

    // Рендер магазина
    renderShop() {
        const categoryTabs = document.getElementById('categoryTabs');
        const shopItems = document.getElementById('shopItems');
        const shopBalance = document.getElementById('shopBalance');
        const inventoryGrid = document.getElementById('inventoryGrid');
        
        const currentPlayer = this.getCurrentPlayer();
        
        // Баланс
        shopBalance.textContent = currentPlayer.reputation;
        
        // Вкладки категорий
        categoryTabs.innerHTML = SHOP_CATEGORIES.map(category => `
            <button class="category-tab ${category.id === 'skills' ? 'active' : ''}" 
                    onclick="game.selectShopCategory('${category.id}')">
                <span class="tab-icon">${category.icon}</span>
                ${category.name}
            </button>
        `).join('');
        
        // Товары (по умолчанию первая категория)
        this.renderShopCategory('skills');
        
        // Инвентарь игрока
        this.renderPlayerInventory();
    }

    // Рендер категории магазина
    renderShopCategory(categoryId) {
        const shopItems = document.getElementById('shopItems');
        const currentPlayer = this.getCurrentPlayer();
        const category = SHOP_ITEMS[categoryId];
        
        if (!category) return;
        
        shopItems.innerHTML = category.items.map(item => {
            const canAfford = currentPlayer.reputation >= item.price;
            const alreadyOwned = currentPlayer.inventory.some(inv => inv.id === item.id && 
                (item.maxLevel ? inv.level >= item.maxLevel : true));
            
            return `
                <div class="shop-item ${item.featured ? 'featured' : ''}">
                    <div class="shop-item-header">
                        <div class="item-icon">${item.icon}</div>
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-description">${item.description}</div>
                        </div>
                        <div class="item-price">
                            <span class="price-icon">⭐</span>
                            ${item.price}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="buy-btn" 
                                onclick="game.buyItem('${categoryId}', '${item.id}')"
                                ${!canAfford || alreadyOwned ? 'disabled' : ''}>
                            <span class="btn-icon">🛒</span>
                            ${alreadyOwned ? 'Куплено' : canAfford ? 'Купить' : 'Недостаточно'}
                        </button>
                        <button class="info-btn" onclick="game.showItemInfo('${categoryId}', '${item.id}')">
                            ℹ️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Обновляем активную вкладку
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.category-tab[onclick*="${categoryId}"]`).classList.add('active');
    }

    // Выбор категории магазина
    selectShopCategory(categoryId) {
        this.renderShopCategory(categoryId);
    }

    // Покупка предмета
    buyItem(categoryId, itemId) {
        const currentPlayer = this.getCurrentPlayer();
        const category = SHOP_ITEMS[categoryId];
        const item = category.items.find(i => i.id === itemId);
        
        if (!item || currentPlayer.reputation < item.price) {
            this.showNotification('Недостаточно репутации!', 'error');
            return;
        }
        
        // Списание стоимости
        currentPlayer.reputation -= item.price;
        
        // Добавление в инвентарь
        const inventoryItem = {
            id: item.id,
            name: item.name,
            icon: item.icon,
            type: item.type,
            effect: item.effect,
            purchasedAt: new Date().toISOString()
        };
        
        // Для улучшений увеличиваем уровень
        const existingItem = currentPlayer.inventory.find(inv => inv.id === item.id);
        if (existingItem) {
            existingItem.level = (existingItem.level || 1) + 1;
        } else {
            inventoryItem.level = 1;
            currentPlayer.inventory.push(inventoryItem);
        }
        
        // Применение эффекта
        this.applyItemEffect(item, currentPlayer);
        
        // Обновление интерфейса
        this.updateGameInterface();
        this.renderShop();
        this.renderPlayerInventory();
        
        this.addHistoryMessage(
            currentPlayer.name + HISTORY_MESSAGES.item_purchase + item.name
        );
        
        this.showNotification(`Успешная покупка: ${item.name}`, 'success');
        this.saveToStorage();
    }

    // Применение эффекта предмета
    applyItemEffect(item, player) {
        switch (item.effect) {
            case 'add_reputation':
                player.reputation += item.amount;
                this.showNotification(`+${item.amount} репутации!`, 'success');
                break;
            case 'add_skill_slot':
                // Увеличиваем максимальное количество навыков
                if (!player.maxSkills) player.maxSkills = 2;
                player.maxSkills += 1;
                this.showNotification('Дополнительный слот для навыка открыт!', 'success');
                break;
            case 'level_up':
                this.forceLevelUp(player);
                break;
            case 'skill_boost':
                player.skillBoost = {
                    skill: item.skill,
                    duration: item.duration,
                    bonus: 1
                };
                this.showNotification(`Навык усилен на ${item.duration} хода!`, 'success');
                break;
            default:
                this.showNotification(`Эффект "${item.name}" активирован!`, 'success');
        }
    }

    // Принудительное повышение уровня
    forceLevelUp(player) {
        const levels = Object.keys(CAREER_LEVELS);
        const currentIndex = levels.indexOf(player.level);
        
        if (currentIndex < levels.length - 1) {
            player.level = levels[currentIndex + 1];
            this.showNotification(`Уровень повышен до ${CAREER_LEVELS[player.level].name}!`, 'success');
        } else {
            this.showNotification('Вы уже достигли максимального уровня!', 'info');
        }
    }

    // Рендер инвентаря игрока
    renderPlayerInventory() {
        const inventoryGrid = document.getElementById('inventoryGrid');
        const currentPlayer = this.getCurrentPlayer();
        
        if (currentPlayer.inventory.length === 0) {
            inventoryGrid.innerHTML = `
                <div class="empty-inventory">
                    <div class="empty-icon">🎒</div>
                    <div class="empty-text">Инвентарь пуст</div>
                    <div class="empty-subtext">Купите улучшения в магазине</div>
                </div>
            `;
            return;
        }
        
        inventoryGrid.innerHTML = currentPlayer.inventory.map(item => `
            <div class="inventory-item ${item.active ? 'active' : ''}">
                <div class="inventory-icon">${item.icon}</div>
                <div class="inventory-name">${item.name}</div>
                ${item.level > 1 ? `<div class="inventory-level">${item.level}</div>` : ''}
            </div>
        `).join('');
    }

    // Показ информации о товаре
    showItemInfo(categoryId, itemId) {
        const category = SHOP_ITEMS[categoryId];
        const item = category.items.find(i => i.id === itemId);
        
        if (!item) return;
        
        // Заполняем модальное окно
        document.getElementById('modalItemIcon').textContent = item.icon;
        document.getElementById('modalItemName').textContent = item.name;
        document.getElementById('modalItemDescription').textContent = item.description;
        document.getElementById('modalItemPrice').textContent = `${item.price} ⭐`;
        document.getElementById('modalItemType').textContent = this.getItemTypeName(item.type);
        document.getElementById('modalItemEffect').textContent = this.getItemEffectDescription(item);
        
        // Обработчик покупки
        const buyBtn = document.getElementById('modalBuyBtn');
        const currentPlayer = this.getCurrentPlayer();
        const canAfford = currentPlayer.reputation >= item.price;
        const alreadyOwned = currentPlayer.inventory.some(inv => inv.id === item.id && 
            (item.maxLevel ? inv.level >= item.maxLevel : true));
        
        buyBtn.onclick = () => {
            if (!alreadyOwned && canAfford) {
                this.buyItem(categoryId, itemId);
                this.closeItemModal();
            }
        };
        
        buyBtn.disabled = alreadyOwned || !canAfford;
        buyBtn.innerHTML = alreadyOwned ? 
            '✅ Куплено' : 
            canAfford ? 
                '<span class="btn-icon">🛒</span> Купить' : 
                '❌ Недостаточно';
        
        // Показываем модальное окно
        document.getElementById('itemModal').style.display = 'flex';
    }

    // Закрытие модального окна
    closeItemModal() {
        document.getElementById('itemModal').style.display = 'none';
    }

    // Получение названия типа предмета
    getItemTypeName(type) {
        const types = {
            permanent: 'Постоянное улучшение',
            temporary: 'Временный эффект',
            consumable: 'Расходный предмет',
            instant: 'Мгновенный эффект'
        };
        return types[type] || type;
    }

    // Получение описания эффекта предмета
    getItemEffectDescription(item) {
        const effects = {
            add_skill_slot: 'Дополнительный слот для навыка',
            skill_boost: 'Временное усиление навыка',
            reroll_dice: 'Переброс кубика',
            dice_bonus: 'Бонус к броску кубика',
            add_reputation: 'Увеличение репутации',
            reputation_multiplier: 'Умножение награды',
            time_extension: 'Дополнительное время',
            skip_quest: 'Пропуск задания',
            get_hint: 'Получение подсказки',
            level_up: 'Повышение уровня',
            auto_success: 'Автоматический успех в задании',
            reputation_shield: 'Защита репутации при провале',
            advantage_roll: 'Бросок двух кубиков с выбором лучшего',
            perfect_roll: 'Гарантированный максимальный бросок'
        };
        return effects[item.effect] || 'Особый эффект';
    }

    // Завершение игры
    endGame() {
        this.gameState = 'ended';
        
        // Скрываем игровой интерфейс, показываем результаты
        document.getElementById('gameInterface').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        
        this.showResults();
        this.saveToStorage();
    }

    // Показ результатов
    showResults() {
        const winnerCard = document.getElementById('winnerCard');
        const finalResults = document.getElementById('finalResults');
        
        // Определяем победителя
        const sortedPlayers = [...this.players].sort((a, b) => b.reputation - a.reputation);
        const winner = sortedPlayers[0];
        
        // Карточка победителя
        winnerCard.innerHTML = `
            <div class="winner-avatar">${PLAYER_COLORS[winner.color].emoji}</div>
            <div class="winner-name">${winner.name}</div>
            <div class="winner-title">Победитель игры!</div>
            <div class="winner-stats">
                <div class="winner-stat">
                    <span class="stat-label">Репутация:</span>
                    <span class="stat-value">${winner.reputation} ⭐</span>
                </div>
                <div class="winner-stat">
                    <span class="stat-label">Уровень:</span>
                    <span class="stat-value">${CAREER_LEVELS[winner.level].name}</span>
                </div>
                <div class="winner-stat">
                    <span class="stat-label">Выполнено заданий:</span>
                    <span class="stat-value">${winner.completedQuests}</span>
                </div>
            </div>
        `;
        
        // Финальные результаты всех игроков
        finalResults.innerHTML = sortedPlayers
            .map((player, index) => `
                <div class="result-row ${player.id === winner.id ? 'winner' : ''}">
                    <div class="result-rank">${index + 1}</div>
                    <div class="result-player">
                        <div class="player-color-small ${player.color}"></div>
                        ${player.name}
                    </div>
                    <div class="result-reputation">${player.reputation} ⭐</div>
                    <div class="result-level">${CAREER_LEVELS[player.level].name}</div>
                </div>
            `)
            .join('');
    }

    // Новая игра
    newGame() {
        if (confirm('Начать новую игру? Текущий прогресс будет потерян.')) {
            this.players = [];
            this.currentPlayerIndex = 0;
            this.currentTurn = 1;
            this.gameState = 'setup';
            this.history = [];
            this.diceValue = 0;
            this.currentQuest = null;
            this.currentCellType = null;
            
            // Переключаем интерфейсы
            document.getElementById('resultsSection').style.display = 'none';
            document.getElementById('gameInterface').style.display = 'none';
            document.getElementById('setupSection').style.display = 'block';
            
            this.updatePlayersList();
            this.updateStartButton();
            
            // Очищаем хранилище
            localStorage.removeItem('professionalTrackGame');
            
            this.showNotification('Новая игра начата!', 'success');
        }
    }

    // Вспомогательные методы
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
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

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showNotification(message, type = 'info') {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-text">${message}</span>
            </div>
        `;
        
        // Добавляем стили
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        // Добавляем CSS анимации
        this.addNotificationStyles();
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

    getNotificationColor(type) {
        const colors = {
            success: '#00b894',
            error: '#ff7675',
            warning: '#fdcb6e',
            info: '#74b9ff'
        };
        return colors[type] || '#74b9ff';
    }

    addNotificationStyles() {
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // Сохранение и загрузка
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
            saveTime: new Date().toISOString()
        };
        
        localStorage.setItem('professionalTrackGame', JSON.stringify(gameData));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('professionalTrackGame');
        if (saved) {
            try {
                const gameData = JSON.parse(saved);
                
                this.players = gameData.players || [];
                this.currentPlayerIndex = gameData.currentPlayerIndex || 0;
                this.currentTurn = gameData.currentTurn || 1;
                this.gameState = gameData.gameState || 'setup';
                this.history = gameData.history || [];
                this.diceValue = gameData.diceValue || 0;
                this.currentQuest = gameData.currentQuest || null;
                this.currentCellType = gameData.currentCellType || null;
                
                // Восстанавливаем интерфейс в зависимости от состояния игры
                if (this.gameState === 'playing') {
                    document.getElementById('setupSection').style.display = 'none';
                    document.getElementById('gameInterface').style.display = 'block';
                    this.updateGameInterface();
                } else if (this.gameState === 'ended') {
                    document.getElementById('setupSection').style.display = 'none';
                    document.getElementById('gameInterface').style.display = 'none';
                    document.getElementById('resultsSection').style.display = 'block';
                    this.showResults();
                } else {
                    this.updatePlayersList();
                    this.updateStartButton();
                }
                
                console.log('Игра загружена из сохранения');
                
            } catch (e) {
                console.error('Ошибка загрузки сохранения:', e);
                localStorage.removeItem('professionalTrackGame');
            }
        }
    }
}

// Инициализация игры при загрузке страницы
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new ProfessionalTrackGame();
});

// Глобальные функции для вызовов из HTML
function removePlayer(playerId) {
    if (game) {
        game.removePlayer(playerId);
    }
}

function selectShopCategory(categoryId) {
    if (game) {
        game.selectShopCategory(categoryId);
    }
}

function buyItem(categoryId, itemId) {
    if (game) {
        game.buyItem(categoryId, itemId);
    }
}

function showItemInfo(categoryId, itemId) {
    if (game) {
        game.showItemInfo(categoryId, itemId);
    }
}
