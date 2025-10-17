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
            alert('Пожалуйста, введите имя игрока');
            return;
        }
        
        if (this.usedColors.has(color)) {
            alert('Этот цвет уже занят. Выберите другой цвет.');
            return;
        }
        
        // Создаем нового игрока
        const player = {
            id: Date.now(),
            name: name,
            color: color,
            position: 1,
            reputation: 3,
            careerLevel: 'intern',
            skills: this.generateRandomSkills(),
            usedResource: false
        };
        
        this.players.push(player);
        this.usedColors.add(color);
        
        // Обновляем интерфейс
        this.updatePlayersList();
        this.updateStartButton();
        
        // Очищаем форму
        nameInput.value = '';
        nameInput.focus();
    }

    generateRandomSkills() {
        const skillIds = Object.keys(SKILLS);
        const shuffled = skillIds.sort(() => 0.5 - Math.random());
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
        }
    }

    updatePlayersList() {
        const playersList = document.getElementById('playersList');
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

    updateStartButton() {
        const startBtn = document.getElementById('startGameBtn');
        startBtn.disabled = this.players.length < 2;
    }

    startGame() {
        if (this.players.length < 2) {
            alert('Для начала игры нужно минимум 2 игрока');
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
    }

    updateCurrentPlayer() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Обновляем карточку текущего игрока
        document.getElementById('currentPlayerAvatar').style.backgroundColor = PLAYER_COLORS[currentPlayer.color].hex;
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
        diceResult.textContent = "Бросок...";
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
        diceResult.textContent = `Выпало: ${result}`;
        
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
            difficultyElement.textContent = `Сложность: ${difficulty}`;
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
        
        // Показываем сообщение о результате
        alert(message);
        
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
                
                if (level === 'specialist' || level === 'expert' || level === 'leader') {
                    // Сообщение о повышении уровня показывается в основном сообщении
                }
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
        playersTable.innerHTML = '';
        
        // Заголовок таблицы
        const headerRow = document.createElement('div');
        headerRow.className = 'table-row table-header';
        headerRow.innerHTML = `
            <div class="table-cell">#</div>
            <div class="table-cell">Игрок</div>
            <div class="table-cell">Уровень</div>
            <div class="table-cell">Репутация</div>
        `;
        playersTable.appendChild(headerRow);
        
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
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${player.color}`;
        
        const resultIcon = success ? '✅' : '❌';
        const changeText = reputationChange > 0 ? `+${reputationChange} Репутации` : 'Без изменений';
        
        historyItem.innerHTML = `
            <strong>${player.name}: ${this.currentQuest.title}</strong><br>
            <small>${resultIcon} ${changeText} | Уровень: ${CAREER_LEVELS[player.careerLevel].name}</small>
        `;
        
        const history = document.getElementById('history');
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
            if (history.children.length > 10) {
                history.removeChild(history.lastChild);
            }
        }
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
        document.getElementById('playersList').innerHTML = '';
        document.getElementById('playerNameInput').value = '';
        document.getElementById('history').innerHTML = '';
        
        this.updateStartButton();
        this.showWelcomeState();
    }

    updateCurrentStep(text) {
        document.getElementById('currentStep').textContent = text;
    }

    showWelcomeState() {
        this.updateCurrentStep("Добавьте игроков для начала игры");
        document.getElementById('diceNumber').textContent = "?";
        document.getElementById('diceResult').textContent = "Результат: -";
        
        this.hideDiceDots();
        this.resetQuestDisplay();
    }

    resetQuestDisplay() {
        const questElement = document.getElementById('currentQuest');
        const instructionsElement = document.getElementById('instructionsText');
        const rewardsElement = document.getElementById('rewardsText');
        const difficultyElement = document.getElementById('questDifficulty');
        
        questElement.textContent = "Бросьте кубик для получения задания!";
        instructionsElement.textContent = "• Бросьте кубик для определения типа клетки\n• Выполните профессиональное задание\n• Получите репутацию и развивайтесь";
        rewardsElement.textContent = "• Репутация и профессиональный рост\n• Новые навыки и компетенции\n• Карьерное развитие";
        difficultyElement.textContent = "Сложность: -";
    }
}

// Создаем глобальную переменную для доступа к методам из HTML
const game = new ProfessionalTrackGame();
