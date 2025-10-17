class ProfessionalTrackGame {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentTurn = 1;
        this.currentQuest = null;
        this.isRolling = false;
        this.gameHistory = [];
        this.gameActive = false;
        this.usedColors = new Set();
        this.shop = new Shop(this);
        
        this.init();
    }

    init() {
        // Инициализация Telegram Web App
        this.tg = window.Telegram.WebApp;
        this.tg.expand();
        this.tg.enableClosingConfirmation();

        // Назначение обработчиков событий
        document.getElementById('addPlayerBtn').addEventListener('click', () => this.addPlayer());
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('rollBtn').addEventListener('click', () => this.rollDice());
        document.getElementById('successBtn').addEventListener('click', () => this.completeQuest(true));
        document.getElementById('failBtn').addEventListener('click', () => this.completeQuest(false));
        document.getElementById('nextPlayerBtn').addEventListener('click', () => this.nextPlayer());
        document.getElementById('endGameBtn').addEventListener('click', () => this.endGame());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('shopBtn').addEventListener('click', () => this.openShop());
        document.getElementById('closeShopBtn').addEventListener('click', () => this.closeShop());

        // Enter для добавления игрока
        document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPlayer();
            }
        });

        this.showWelcomeState();
    }

    addPlayer() {
        const nameInput = document.getElementById('playerNameInput');
        const colorSelect = document.getElementById('playerColorSelect');
        
        const name = nameInput.value.trim();
        const color = colorSelect.value;
        
        if (!name) {
            this.showMessage('Пожалуйста, введите имя игрока', 'warning');
            return;
        }
        
        if (this.players.length >= 6) {
            this.showMessage('Максимальное количество игроков - 6', 'warning');
            return;
        }
        
        if (this.usedColors.has(color)) {
            this.showMessage('Этот цвет уже занят. Выберите другой цвет.', 'warning');
            return;
        }
        
        // Создаем нового игрока
        const player = {
            id: Date.now() + Math.random(),
            name: name,
            color: color,
            position: 1,
            reputation: 3,
            careerLevel: 'intern',
            skills: this.generateRandomSkills(),
            usedResource: false,
            inventory: []
        };
        
        this.players.push(player);
        this.usedColors.add(color);
        
        // Обновляем интерфейс
        this.updatePlayersList();
        this.updateStartButton();
        
        // Очищаем форму
        nameInput.value = '';
        nameInput.focus();
        
        this.showMessage(`Игрок ${name} добавлен!`, 'success');
    }

    showMessage(text, type = 'info') {
        // Создаем временное уведомление
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#00b894' : type === 'warning' ? '#fdcb6e' : '#74b9ff'};
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(message);
        
        // Удаляем сообщение через 3 секунды
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    generateRandomSkills() {
        const skillIds = Object.keys(SKILLS);
        const shuffled = [...skillIds].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    }

    removePlayer(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex > -1) {
            const player = this.players[playerIndex];
            this.usedColors.delete(player.color);
            this.players.splice(playerIndex, 1);
            
            this.updatePlayersList();
            this.updateStartButton();
            
            this.showMessage(`Игрок ${player.name} удален`, 'info');
        }
    }

    updatePlayersList() {
        const playersList = document.getElementById('playersList');
        const playerCount = document.getElementById('playerCount');
        
        playerCount.textContent = `${this.players.length} игрок${this.getRussianPlural(this.players.length)}`;
        
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
        
        playersList.innerHTML = '';
        
        this.players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = `player-item ${player.color}`;
            playerItem.innerHTML = `
                <div class="player-info">
                    <div class="player-color ${player.color}"></div>
                    <span>${player.name}</span>
                </div>
                <button class="remove-player" onclick="game.removePlayer(${player.id})">×</button>
            `;
            playersList.appendChild(playerItem);
        });
        
        document.getElementById('totalPlayers').textContent = this.players.length;
    }

    getRussianPlural(number) {
        if (number % 10 === 1 && number % 100 !== 11) return '';
        if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) return 'а';
        return 'ов';
    }

    updateStartButton() {
        const startBtn = document.getElementById('startGameBtn');
        startBtn.disabled = this.players.length < 2;
    }

    startGame() {
        if (this.players.length < 2) {
            this.showMessage('Для начала игры нужно минимум 2 игрока', 'warning');
            return;
        }
        
        this.gameActive = true;
        this.currentPlayerIndex = 0;
        this.currentTurn = 1;
        
        // Переключаем на игровой интерфейс
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('gameInterface').style.display = 'block';
        
        this.updateCurrentPlayer();
        this.updatePlayersTable();
        this.updateCurrentStep(`Ход ${this.currentTurn}. ${this.players[0].name}, ваш ход!`);
        
        this.showMessage('Игра началась! Удачи всем игрокам!', 'success');
    }

    updateCurrentPlayer() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const playerColor = PLAYER_COLORS[currentPlayer.color];
        
        // Обновляем карточку текущего игрока
        document.getElementById('currentPlayerAvatar').style.backgroundColor = playerColor.hex;
        document.getElementById('currentPlayerName').textContent = currentPlayer.name;
        document.getElementById('currentPlayerReputation').textContent = currentPlayer.reputation;
        document.getElementById('currentPlayerLevel').textContent = CAREER_LEVELS[currentPlayer.careerLevel].name;
        
        // Обновляем статус игры
        document.getElementById('currentTurn').textContent = this.currentTurn;
        
        // Сбрасываем состояние задания
        document.getElementById('completionButtons').style.display = 'none';
        document.getElementById('rollBtn').disabled = false;
        
        this.updateCurrentStep(`Ход ${this.currentTurn}. ${currentPlayer.name}, бросьте кубик!`);
    }

    hideDiceDots() {
        const diceDots = document.getElementById('diceDots');
        diceDots.innerHTML = '';
    }

    createDiceDots(number) {
        const diceDots = document.getElementById('diceDots');
        diceDots.innerHTML = '';
        
        const dotPositions = {
            1: ['5'],
            2: ['1', '9'],
            3: ['1', '5', '9'],
            4: ['1', '3', '7', '9'],
            5: ['1', '3', '5', '7', '9'],
            6: ['1', '3', '4', '6', '7', '9']
        };
        
        const positions = dotPositions[number] || [];
        positions.forEach(pos => {
            const dot = document.createElement('div');
            dot.className = 'dice-dot';
            dot.style.gridArea = pos;
            diceDots.appendChild(dot);
        });
    }

    async rollDice() {
        if (this.isRolling || !this.gameActive) return;
        
        this.isRolling = true;
        
        const rollBtn = document.getElementById('rollBtn');
        const dice = document.getElementById('dice');
        const diceResult = document.getElementById('diceResult');
        const diceNumber = document.getElementById('diceNumber');
        
        rollBtn.disabled = true;
        dice.classList.add('rolling');
        diceResult.querySelector('.result-text').textContent = "Бросок...";
        diceNumber.textContent = "?";
        this.hideDiceDots();
        
        document.getElementById('completionButtons').style.display = 'none';

        // Анимация броска
        let rolls = 0;
        const maxRolls = 12;
        const rollInterval = setInterval(() => {
            const randomNumber = Math.floor(Math.random() * 6) + 1;
            diceNumber.textContent = randomNumber;
            this.createDiceDots(randomNumber);
            rolls++;
            
            if (rolls >= maxRolls) {
                clearInterval(rollInterval);
                setTimeout(() => this.finishRoll(), 300);
            }
        }, 100);
    }

    finishRoll() {
        const dice = document.getElementById('dice');
        const rollBtn = document.getElementById('rollBtn');
        const diceResult = document.getElementById('diceResult');
        const diceNumber = document.getElementById('diceNumber');
        
        dice.classList.remove('rolling');
        
        // Финальный результат с учетом бонусов уровня
        const currentPlayer = this.players[this.currentPlayerIndex];
        let result = Math.floor(Math.random() * 6) + 1;
        if (currentPlayer.careerLevel === 'expert' || currentPlayer.careerLevel === 'leader') {
            result = Math.min(6, result + 1); // +1 к броску для экспертов и лидеров
        }
        
        diceNumber.textContent = result;
        this.createDiceDots(result);
        diceResult.querySelector('.result-text').textContent = `Результат: ${result}`;
        
        // Определяем тип клетки и получаем задание
        this.getQuestForRoll(result);
        
        this.isRolling = false;
        rollBtn.disabled = true;
    }

    getQuestForRoll(diceResult) {
        // Определяем тип клетки по результату броска
        let cellType = 'green'; // По умолчанию зеленая клетка
        
        if (diceResult <= 2) {
            cellType = 'green'; // 1-2: зеленая клетка (60%)
        } else if (diceResult <= 4) {
            cellType = 'blue'; // 3-4: синяя клетка (20%)
        } else if (diceResult === 5) {
            cellType = 'yellow'; // 5: желтая клетка (10%)
        } else {
            cellType = 'purple'; // 6: фиолетовая клетка (10%)
        }
        
        this.showQuest(cellType);
    }

    showQuest(cellType) {
        const quests = QUESTS[cellType];
        const randomQuest = quests[Math.floor(Math.random() * quests.length)];
        this.currentQuest = randomQuest;
        
        const cellInfo = {
            type: cellType,
            position: `Определено кубиком`
        };
        
        this.displayQuest(randomQuest, cellInfo);
        
        document.getElementById('completionButtons').style.display = 'grid';
        
        const currentPlayer = this.players[this.currentPlayerIndex];
        this.updateCurrentStep(`${currentPlayer.name}, выполните задание!`);
    }

    displayQuest(quest, cellInfo) {
        const questElement = document.getElementById('currentQuest');
        const instructionsElement = document.getElementById('instructionsText');
        const rewardsElement = document.getElementById('rewardsText');
        const difficultyElement = document.getElementById('questDifficulty');
        const cellSection = document.getElementById('cellSection');
        const cellTypeElement = document.getElementById('cellType');
        const cellDescription = document.getElementById('cellDescription');
        const cellPosition = document.getElementById('cellPosition');
        
        // Обновляем отображение клетки
        cellSection.className = `cell-section cell-${cellInfo.type} fade-in`;
        cellTypeElement.textContent = this.getCellTypeName(cellInfo.type);
        cellDescription.textContent = this.getCellTypeDescription(cellInfo.type);
        cellPosition.textContent = `Позиция: ${cellInfo.position}`;
        
        // Анимация появления задания
        questElement.style.opacity = '0';
        instructionsElement.style.opacity = '0';
        rewardsElement.style.opacity = '0';
        
        setTimeout(() => {
            questElement.textContent = quest.description;
            instructionsElement.innerHTML = quest.instructions.join('<br>');
            rewardsElement.innerHTML = quest.rewards.map(reward => `• ${reward}`).join('<br>');
            
            const difficulty = quest.difficulty;
            difficultyElement.querySelector('.difficulty-text').textContent = `Сложность: ${difficulty}`;
            difficultyElement.className = `quest-difficulty difficulty-${difficulty}`;
            
            questElement.style.opacity = '1';
            instructionsElement.style.opacity = '1';
            rewardsElement.style.opacity = '1';
        }, 300);
    }

    getCellTypeName(type) {
        const names = {
            green: '🟢 Профессиональный рост',
            blue: '🔵 Сетевой нетворкинг',
            yellow: '🟡 События рынка',
            purple: '🟣 Создание профессии будущего'
        };
        return names[type] || type;
    }

    getCellTypeDescription(type) {
        const descriptions = {
            green: 'Индивидуальные кейсы и мини-вызовы',
            blue: 'Взаимодействие с другими игроками',
            yellow: 'Случайные события, влияющие на всех',
            purple: 'Возможность создать новую профессию'
        };
        return descriptions[type] || '';
    }

    completeQuest(success) {
        if (!this.currentQuest) return;
        
        const currentPlayer = this.players[this.currentPlayerIndex];
        let reputationChange = 0;
        let message = "";
        
        if (success) {
            // Проверяем наличие нужных навыков
            const hasRequiredSkill = this.currentQuest.requiredSkills.some(skill => 
                currentPlayer.skills.includes(skill)
            );
            
            if (hasRequiredSkill) {
                reputationChange = 2;
                message = "Отлично! Вы использовали свой навык и получили +2 Репутации!";
            } else {
                reputationChange = 1;
                message = "Хорошая работа! Вы аргументировали решение и получили +1 Репутации!";
            }

            // Применяем множители репутации из инвентаря
            const multiplier = this.shop.getReputationMultiplier(currentPlayer);
            if (multiplier > 1) {
                const originalReputation = reputationChange;
                reputationChange = Math.floor(reputationChange * multiplier);
                message += ` Множитель x${multiplier}: +${reputationChange} вместо +${originalReputation}!`;
                this.shop.consumeItem(currentPlayer, 'reputation_multiplier');
            }
        } else {
            message = "Задание не выполнено. Попробуйте в следующий раз!";
        }
        
        // Обновляем репутацию игрока
        currentPlayer.reputation += reputationChange;
        
        // Проверяем повышение уровня
        this.checkLevelUp(currentPlayer);
        
        // Добавляем в историю
        this.addToHistory(currentPlayer, success, reputationChange);
        
        // Обновляем интерфейс
        this.updatePlayersTable();
        this.updateCurrentPlayer();
        
        // Показываем сообщение о результате
        this.showMessage(message, success ? 'success' : 'info');
        
        // Автоматически переходим к следующему игроку через 2 секунды
        setTimeout(() => {
            this.nextPlayer();
        }, 2000);
    }

    checkLevelUp(player) {
        const levels = Object.entries(CAREER_LEVELS);
        for (const [level, info] of levels) {
            if (player.reputation >= info.reputation && level !== player.careerLevel) {
                player.careerLevel = level;
                this.showMessage(`🎉 ${player.name} достиг уровня "${info.name}"!`, 'success');
                break;
            }
        }
    }

    nextPlayer() {
        // Переходим к следующему игроку
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // Если прошли полный круг, увеличиваем номер хода
        if (this.currentPlayerIndex === 0) {
            this.currentTurn++;
            
            // Проверяем условие завершения игры (например, после 10 ходов)
            if (this.currentTurn > 10) {
                this.endGame();
                return;
            }
        }
        
        this.updateCurrentPlayer();
        this.updateCurrentStep(`Ход ${this.currentTurn}. ${this.players[this.currentPlayerIndex].name}, ваш ход!`);
    }

    updatePlayersTable() {
        const playersTable = document.getElementById('playersTable');
        
        // Очищаем только строки с игроками, оставляя заголовок
        const existingRows = playersTable.querySelectorAll('.table-row:not(.table-header)');
        existingRows.forEach(row => row.remove());
        
        // Данные игроков
        this.players.forEach((player, index) => {
            const row = document.createElement('div');
            row.className = `table-row ${index === this.currentPlayerIndex ? 'current-turn' : ''}`;
            row.innerHTML = `
                <div class="table-cell">${index + 1}</div>
                <div class="table-cell">
                    <div class="player-color-small ${player.color}"></div>
                    ${player.name}
                </div>
                <div class="table-cell">${CAREER_LEVELS[player.careerLevel].name}</div>
                <div class="table-cell">${player.reputation}</div>
            `;
            playersTable.appendChild(row);
        });
    }

    addToHistory(player, success, reputationChange) {
        const history = document.getElementById('history');
        
        // Убираем пустое состояние если оно есть
        const emptyState = history.querySelector('.empty-history');
        if (emptyState) {
            emptyState.remove();
        }
        
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${player.color}`;
        
        const resultIcon = success ? '✅' : '❌';
        const changeText = reputationChange > 0 ? `+${reputationChange} Репутации` : 'Без изменений';
        
        historyItem.innerHTML = `
            <strong>${player.name}: ${this.currentQuest.title}</strong><br>
            <small>${resultIcon} ${changeText} | Уровень: ${CAREER_LEVELS[player.careerLevel].name}</small>
        `;
        
        history.insertBefore(historyItem, history.firstChild);
        
        // Сохраняем в массив истории
        this.gameHistory.unshift({
            player: player.name,
            quest: this.currentQuest.title,
            success: success,
            reputationChange: reputationChange,
            timestamp: new Date().toLocaleTimeString()
        });
        
        // Ограничиваем историю 10 последними записями
        if (this.gameHistory.length > 10) {
            this.gameHistory.pop();
            const historyItems = history.querySelectorAll('.history-item');
            if (historyItems.length > 10) {
                historyItems[historyItems.length - 1].remove();
            }
        }
    }

    openShop() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        this.shop.open(currentPlayer);
    }

    closeShop() {
        this.shop.close();
    }

    endGame() {
        this.gameActive = false;
        
        // Определяем победителя
        const winner = this.players.reduce((prev, current) => 
            (prev.reputation > current.reputation) ? prev : current
        );
        
        // Показываем экран результатов
        document.getElementById('gameInterface').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        
        this.showResults(winner);
    }

    showResults(winner) {
        const winnerCard = document.getElementById('winnerCard');
        const finalResults = document.getElementById('finalResults');
        const winnerColor = PLAYER_COLORS[winner.color];
        
        // Победитель
        winnerCard.innerHTML = `
            <h3>🏆 Победитель!</h3>
            <div style="display: flex; align-items: center; gap: 15px; margin: 15px 0;">
                <div class="player-color ${winner.color}" style="width: 40px; height: 40px;"></div>
                <div>
                    <div style="font-size: 20px; font-weight: bold;">${winner.name}</div>
                    <div>Уровень: ${CAREER_LEVELS[winner.careerLevel].name}</div>
                    <div>Репутация: ${winner.reputation}</div>
                </div>
            </div>
        `;
        
        // Финальные результаты всех игроков
        finalResults.innerHTML = `
            <h4>📊 Финальные результаты:</h4>
            ${this.players.map(player => `
                <div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <span>${player.name}</span>
                    <span>${player.reputation} репутации (${CAREER_LEVELS[player.careerLevel].name})</span>
                </div>
            `).join('')}
        `;
    }

    newGame() {
        // Сброс игры
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentTurn = 1;
        this.gameHistory = [];
        this.usedColors.clear();
        this.gameActive = false;
        
        // Сброс интерфейса
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('setupSection').style.display = 'block';
        document.getElementById('playersList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-text">Пока нет игроков</div>
                <div class="empty-subtext">Добавьте первого игрока чтобы начать</div>
            </div>
        `;
        document.getElementById('playerNameInput').value = '';
        document.getElementById('history').innerHTML = `
            <div class="empty-history">
                <div class="empty-icon">📝</div>
                <div class="empty-text">История пока пуста</div>
                <div class="empty-subtext">Здесь будут отображаться действия игроков</div>
            </div>
        `;
        
        this.updateStartButton();
        this.showWelcomeState();
        
        this.showMessage('Новая игра готова к настройке!', 'success');
    }

    updateCurrentStep(text) {
        document.getElementById('currentStep').textContent = text;
    }

    showWelcomeState() {
        this.updateCurrentStep("Добавьте игроков для начала игры");
        document.getElementById('diceNumber').textContent = "?";
        document.getElementById('diceResult').querySelector('.result-text').textContent = "Результат: -";
        
        this.hideDiceDots();
        this.resetQuestDisplay();
    }

    resetQuestDisplay() {
        const questElement = document.getElementById('currentQuest');
        const instructionsElement = document.getElementById('instructionsText');
        const rewardsElement = document.getElementById('rewardsText');
        const difficultyElement = document.getElementById('questDifficulty');
        
        questElement.textContent = "Бросьте кубик для получения задания!";
        instructionsElement.innerHTML = '<div class="empty-instruction">-</div>';
        rewardsElement.innerHTML = '<div class="empty-reward">-</div>';
        difficultyElement.querySelector('.difficulty-text').textContent = "Сложность: -";
    }
}

class Shop {
    constructor(game) {
        this.game = game;
        this.currentCategory = 'skills';
        this.init();
    }

    init() {
        // Создаем модальное окно для информации о товаре
        this.createItemModal();
    }

    createItemModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'item-modal';
        this.modal.style.display = 'none';
        this.modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">✕</button>
                <div class="modal-header">
                    <div class="modal-icon" id="modalItemIcon">🎁</div>
                    <div class="modal-title" id="modalItemName">Название товара</div>
                </div>
                <div class="modal-description" id="modalItemDescription">Описание товара</div>
                <div class="modal-details">
                    <div class="detail-item">
                        <span class="detail-label">Цена:</span>
                        <span class="detail-value" id="modalItemPrice">0 ⭐</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Тип:</span>
                        <span class="detail-value" id="modalItemType">-</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Эффект:</span>
                        <span class="detail-value" id="modalItemEffect">-</span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="buy-btn" id="modalBuyBtn">
                        <span class="btn-icon">🛒</span>
                        Купить
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);

        // Обработчики для модального окна
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        this.modal.querySelector('#modalBuyBtn').addEventListener('click', () => this.buyCurrentItem());
    }

    open(player) {
        this.currentPlayer = player;
        this.updateShopDisplay();
        document.getElementById('shopSection').style.display = 'block';
    }

    close() {
        document.getElementById('shopSection').style.display = 'none';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.currentItem = null;
    }

    updateShopDisplay() {
        this.updateBalance();
        this.updateCategories();
        this.updateItems();
        this.updateInventory();
    }

    updateBalance() {
        document.getElementById('shopBalance').textContent = this.currentPlayer.reputation;
    }

    updateCategories() {
        const categoryTabs = document.getElementById('categoryTabs');
        categoryTabs.innerHTML = '';

        SHOP_CATEGORIES.forEach(category => {
            const tab = document.createElement('button');
            tab.className = `category-tab ${this.currentCategory === category.id ? 'active' : ''}`;
            tab.innerHTML = `
                <span class="tab-icon">${category.icon}</span>
                <span class="tab-name">${category.name}</span>
            `;
            tab.addEventListener('click', () => this.switchCategory(category.id));
            categoryTabs.appendChild(tab);
        });
    }

    switchCategory(categoryId) {
        this.currentCategory = categoryId;
        this.updateCategories();
        this.updateItems();
    }

    updateItems() {
        const shopItems = document.getElementById('shopItems');
        const categoryItems = SHOP_ITEMS[this.currentCategory].items;
        
        shopItems.innerHTML = '';

        categoryItems.forEach(item => {
            const canAfford = this.currentPlayer.reputation >= item.price;
            const alreadyOwned = this.currentPlayer.inventory && 
                                this.currentPlayer.inventory.find(invItem => invItem.id === item.id && 
                                (item.type === 'permanent' || invItem.uses > 0));
            const canBuy = canAfford && !(item.type === 'permanent' && alreadyOwned);

            const itemElement = document.createElement('div');
            itemElement.className = `shop-item ${item.featured ? 'featured' : ''}`;
            itemElement.innerHTML = `
                <div class="shop-item-header">
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-description">${item.description}</div>
                    </div>
                    <div class="item-price">
                        <span class="price-icon">⭐</span>
                        <span class="price-amount">${item.price}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="buy-btn" ${!canBuy ? 'disabled' : ''} data-item-id="${item.id}">
                        <span class="btn-icon">${canBuy ? '🛒' : '❌'}</span>
                        ${canBuy ? 'Купить' : alreadyOwned ? 'Уже есть' : 'Не хватает'}
                    </button>
                    <button class="info-btn" data-item-id="${item.id}">ℹ️</button>
                </div>
            `;

            // Обработчики для кнопок
            itemElement.querySelector('.buy-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.buyItem(item);
            });

            itemElement.querySelector('.info-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showItemInfo(item);
            });

            shopItems.appendChild(itemElement);
        });
    }

    updateInventory() {
        const inventoryGrid = document.getElementById('inventoryGrid');
        
        if (!this.currentPlayer.inventory || this.currentPlayer.inventory.length === 0) {
            inventoryGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--text-muted);">
                    <div style="font-size: 32px; margin-bottom: 10px;">🎒</div>
                    <div>Инвентарь пуст</div>
                    <div style="font-size: 12px; opacity: 0.7;">Купите улучшения в магазине</div>
                </div>
            `;
            return;
        }

        inventoryGrid.innerHTML = '';

        this.currentPlayer.inventory.forEach(invItem => {
            const itemData = this.findItemData(invItem.id);
            if (!itemData) return;

            const isActive = invItem.uses > 0 || itemData.type === 'permanent';
            
            const itemElement = document.createElement('div');
            itemElement.className = `inventory-item ${isActive ? 'active' : ''}`;
            itemElement.innerHTML = `
                <div class="inventory-icon">${itemData.icon}</div>
                <div class="inventory-name">${itemData.name}</div>
                ${itemData.type !== 'permanent' ? 
                    `<div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">${invItem.uses} исп.</div>` : 
                    ''
                }
            `;

            itemElement.addEventListener('click', () => {
                this.showItemInfo(itemData, invItem);
            });

            inventoryGrid.appendChild(itemElement);
        });
    }

    findItemData(itemId) {
        for (const category of Object.values(SHOP_ITEMS)) {
            const item = category.items.find(item => item.id === itemId);
            if (item) return item;
        }
        return null;
    }

    showItemInfo(item, inventoryItem = null) {
        this.currentItem = item;
        
        document.getElementById('modalItemIcon').textContent = item.icon;
        document.getElementById('modalItemName').textContent = item.name;
        document.getElementById('modalItemDescription').textContent = item.description;
        document.getElementById('modalItemPrice').textContent = `${item.price} ⭐`;
        
        // Определяем тип товара
        let typeText = '';
        switch (item.type) {
            case 'permanent': typeText = '📦 Постоянное'; break;
            case 'consumable': typeText = '🎯 Расходное'; break;
            case 'temporary': typeText = '⏱️ Временное'; break;
            case 'instant': typeText = '⚡ Мгновенное'; break;
        }
        document.getElementById('modalItemType').textContent = typeText;

        // Описание эффекта
        let effectText = '';
        switch (item.effect) {
            case 'add_skill_slot': effectText = 'Открывает дополнительный слот для навыка'; break;
            case 'skill_boost': effectText = `+1 к проверкам навыка на ${item.duration} хода`; break;
            case 'reroll_dice': effectText = 'Позволяет перебросить кубик 1 раз'; break;
            case 'dice_bonus': effectText = `+${item.bonus} к следующему броску кубика`; break;
            case 'advantage_roll': effectText = 'Бросок двух кубиков с выбором лучшего'; break;
            case 'add_reputation': effectText = `Мгновенно +${item.amount} к репутации`; break;
            case 'reputation_multiplier': effectText = `Умножает репутацию x${item.multiplier}`; break;
            case 'time_extension': effectText = `+${item.minutes} мин. на выполнение задания`; break;
            case 'skip_quest': effectText = 'Пропуск задания без последствий'; break;
            case 'get_hint': effectText = 'Получить подсказку для задания'; break;
        }
        document.getElementById('modalItemEffect').textContent = effectText;

        // Настройка кнопки покупки
        const buyBtn = document.getElementById('modalBuyBtn');
        const canAfford = this.currentPlayer.reputation >= item.price;
        const alreadyOwned = inventoryItem !== null;

        if (alreadyOwned && item.type === 'permanent') {
            buyBtn.disabled = true;
            buyBtn.innerHTML = '<span class="btn-icon">✅</span> Уже куплено';
        } else if (!canAfford) {
            buyBtn.disabled = true;
            buyBtn.innerHTML = '<span class="btn-icon">❌</span> Не хватает репутации';
        } else {
            buyBtn.disabled = false;
            buyBtn.innerHTML = '<span class="btn-icon">🛒</span> Купить';
        }

        this.modal.style.display = 'flex';
    }

    buyItem(item) {
    if (this.currentPlayer.reputation < item.price) {
        this.game.showMessage('Недостаточно репутации!', 'warning');
        return;
    }

    // Проверяем, не куплен ли уже перманентный предмет
    if (item.type === 'permanent') {
        const alreadyOwned = this.currentPlayer.inventory && 
                           this.currentPlayer.inventory.find(invItem => invItem.id === item.id);
        if (alreadyOwned) {
            this.game.showMessage('Это улучшение уже куплено!', 'warning');
            return;
        }
    }

    // Списываем стоимость
    this.currentPlayer.reputation -= item.price;

    // Добавляем предмет в инвентарь
    if (!this.currentPlayer.inventory) {
        this.currentPlayer.inventory = [];
    }

    const inventoryItem = {
        id: item.id,
        type: item.type,
        uses: item.uses || 1,
        duration: item.duration || 0,
        active: true
    };

    // Для мгновенных предметов сразу применяем эффект
    if (item.type === 'instant') {
        this.applyItemEffect(item, inventoryItem);
    } else {
        this.currentPlayer.inventory.push(inventoryItem);
        this.game.showMessage(`🎉 ${item.name} куплен!`, 'success');
    }

    // Обновляем отображение магазина
    this.updateShopDisplay();
    this.closeModal();

    // Анимация успешной покупки
    const shopItems = document.getElementById('shopItems');
    shopItems.classList.add('purchase-success');
    setTimeout(() => shopItems.classList.remove('purchase-success'), 600);
}

applyItemEffect(item, inventoryItem) {
    switch (item.effect) {
        case 'add_reputation':
            this.currentPlayer.reputation += item.amount;
            this.game.showMessage(`✨ +${item.amount} репутации!`, 'success');
            break;
            
        case 'add_skill_slot':
            // Добавляем дополнительный навык
            const availableSkills = Object.keys(SKILLS).filter(skill => 
                !this.currentPlayer.skills.includes(skill)
            );
            if (availableSkills.length > 0) {
                const newSkill = availableSkills[0];
                this.currentPlayer.skills.push(newSkill);
                this.game.showMessage(`🎯 Новый навык: ${SKILLS[newSkill].name}!`, 'success');
            }
            this.currentPlayer.inventory.push(inventoryItem);
            break;
            
        default:
            // Для остальных предметов просто добавляем в инвентарь
            this.currentPlayer.inventory.push(inventoryItem);
            this.game.showMessage(`🎉 ${item.name} куплен!`, 'success');
    }
}

// Метод для использования предметов из инвентаря
useItem(itemId, player) {
    const inventoryItem = player.inventory.find(item => item.id === itemId);
    if (!inventoryItem || inventoryItem.uses <= 0) return false;

    const itemData = this.findItemData(itemId);
    if (!itemData) return false;

    // Применяем эффект
    switch (itemData.effect) {
        case 'reroll_dice':
            if (this.game.isRolling) {
                this.game.showMessage('Используйте предмет после броска!', 'warning');
                return false;
            }
            inventoryItem.uses--;
            this.game.showMessage('🎲 Переброс кубика активирован!', 'success');
            return true;
            
        case 'dice_bonus':
            inventoryItem.uses--;
            this.game.showMessage(`🎯 +${itemData.bonus} к следующему броску!`, 'success');
            return true;
            
        case 'skill_boost':
            inventoryItem.uses--;
            this.game.showMessage('⚡ Буст навыка активирован на 3 хода!', 'success');
            return true;
            
        case 'skip_quest':
            inventoryItem.uses--;
            this.game.showMessage('🏃‍♂️ Задание пропущено!', 'success');
            this.game.nextPlayer();
            return true;
            
        default:
            return false;
    }
}

// Метод для получения множителя репутации
getReputationMultiplier(player) {
    const multiplierItem = player.inventory?.find(item => 
        item.id === 'reputation_multiplier' && item.uses > 0
    );
    return multiplierItem ? 2 : 1;
}

// Метод для потребления предмета
consumeItem(player, itemId) {
    const itemIndex = player.inventory?.findIndex(item => 
        item.id === itemId && item.uses > 0
    );
    
    if (itemIndex > -1) {
        player.inventory[itemIndex].uses--;
        if (player.inventory[itemIndex].uses <= 0) {
            player.inventory.splice(itemIndex, 1);
        }
        return true;
    }
    return false;
}

// Обновляем метод completeQuest в основном классе игры для учета предметов
completeQuest(success) {
    if (!this.currentQuest) return;
    
    const currentPlayer = this.players[this.currentPlayerIndex];
    let reputationChange = 0;
    let message = "";
    
    if (success) {
        // Проверяем наличие нужных навыков
        const hasRequiredSkill = this.currentQuest.requiredSkills.some(skill => 
            currentPlayer.skills.includes(skill)
        );
        
        if (hasRequiredSkill) {
            reputationChange = 2;
            message = "Отлично! Вы использовали свой навык и получили +2 Репутации!";
        } else {
            reputationChange = 1;
            message = "Хорошая работа! Вы аргументировали решение и получили +1 Репутации!";
        }

        // Применяем множители репутации из инвентаря
        const multiplier = this.shop.getReputationMultiplier(currentPlayer);
        if (multiplier > 1) {
            const originalReputation = reputationChange;
            reputationChange = Math.floor(reputationChange * multiplier);
            message += ` Множитель x${multiplier}: +${reputationChange} вместо +${originalReputation}!`;
            this.shop.consumeItem(currentPlayer, 'reputation_multiplier');
        }
    } else {
        message = "Задание не выполнено. Попробуйте в следующий раз!";
    }
    
    // Обновляем репутацию игрока
    currentPlayer.reputation += reputationChange;
    
    // Проверяем повышение уровня
    this.checkLevelUp(currentPlayer);
    
    // Добавляем в историю
    this.addToHistory(currentPlayer, success, reputationChange);
    
    // Обновляем интерфейс
    this.updatePlayersTable();
    this.updateCurrentPlayer();
    
    // Показываем сообщение о результате
    this.showMessage(message, success ? 'success' : 'info');
    
    // Автоматически переходим к следующему игроку через 2 секунды
    setTimeout(() => {
        this.nextPlayer();
    }, 2000);
}
}

// Инициализация игры при загрузке страницы
let game;

document.addEventListener('DOMContentLoaded', function() {
    game = new ProfessionalTrackGame();
});

// Добавляем глобальные функции для обработчиков событий в HTML
window.game = game;
