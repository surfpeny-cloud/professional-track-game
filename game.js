class ProfessionalTrackGame {
    constructor() {
        this.player = {
            skills: [],
            profession: null,
            resource: null,
            reputation: 3,
            careerLevel: 'intern',
            usedResource: false
        };
        this.currentCellType = null;
        this.currentQuest = null;
        this.isRolling = false;
        this.gameHistory = [];
        this.totalRolls = 0;
        
        this.init();
    }

    init() {
        // Инициализация Telegram Web App
        this.tg = window.Telegram.WebApp;
        this.tg.expand();
        this.tg.enableClosingConfirmation();

        // Инициализация навыков
        this.initSkillsGrid();
        
        // Назначение обработчиков событий
        document.getElementById('createCharacterBtn').addEventListener('click', () => this.createCharacter());
        document.getElementById('rollBtn').addEventListener('click', () => this.rollDice());
        document.getElementById('getQuestBtn').addEventListener('click', () => this.getQuest());
        document.getElementById('successBtn').addEventListener('click', () => this.completeQuest(true));
        document.getElementById('failBtn').addEventListener('click', () => this.completeQuest(false));
        
        this.showWelcomeState();
    }

    initSkillsGrid() {
        const skillsGrid = document.getElementById('skillsGrid');
        skillsGrid.innerHTML = '';

        Object.entries(SKILLS).forEach(([id, skill]) => {
            const skillElement = document.createElement('div');
            skillElement.className = 'skill-option';
            skillElement.textContent = skill.name;
            skillElement.dataset.skillId = id;
            
            skillElement.addEventListener('click', () => this.toggleSkill(id, skillElement));
            
            skillsGrid.appendChild(skillElement);
        });
    }

    toggleSkill(skillId, element) {
        const index = this.player.skills.indexOf(skillId);
        
        if (index > -1) {
            // Удаляем навык
            this.player.skills.splice(index, 1);
            element.classList.remove('selected');
        } else if (this.player.skills.length < 2) {
            // Добавляем навык
            this.player.skills.push(skillId);
            element.classList.add('selected');
        }
        
        // Блокируем выбор если уже 2 навыка
        this.updateSkillsAvailability();
    }

    updateSkillsAvailability() {
        const skillOptions = document.querySelectorAll('.skill-option');
        const maxSkillsSelected = this.player.skills.length >= 2;
        
        skillOptions.forEach(option => {
            const isSelected = option.classList.contains('selected');
            if (!isSelected && maxSkillsSelected) {
                option.classList.add('disabled');
            } else {
                option.classList.remove('disabled');
            }
        });
    }

    createCharacter() {
        const profession = document.getElementById('professionSelect').value;
        const resource = document.getElementById('resourceSelect').value;
        
        if (this.player.skills.length !== 2 || !profession || !resource) {
            alert('Пожалуйста, заполните все поля: выберите 2 навыка, профессиональный интерес и личный ресурс.');
            return;
        }
        
        this.player.profession = profession;
        this.player.resource = resource;
        
        // Переключаем на игровой интерфейс
        document.getElementById('characterSection').style.display = 'none';
        document.getElementById('gameInterface').style.display = 'block';
        
        this.updatePlayerProfile();
        this.updateCurrentStep('Бросьте кубик для определения типа задания');
    }

    updatePlayerProfile() {
        document.getElementById('playerName').textContent = PROFESSIONS[this.player.profession].name;
        document.getElementById('reputation').textContent = this.player.reputation;
        document.getElementById('playerLevel').textContent = CAREER_LEVELS[this.player.careerLevel].name;
        
        // Обновляем навыки
        const skillsContainer = document.getElementById('playerSkills');
        skillsContainer.innerHTML = '';
        
        this.player.skills.forEach(skillId => {
            const skillTag = document.createElement('div');
            skillTag.className = 'skill-tag';
            skillTag.textContent = SKILLS[skillId].name;
            skillsContainer.appendChild(skillTag);
        });
    }

    updateCurrentStep(text) {
        document.getElementById('currentStep').textContent = text;
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
        if (this.isRolling) return;
        
        this.isRolling = true;
        this.totalRolls++;
        
        const rollBtn = document.getElementById('rollBtn');
        const dice = document.getElementById('dice');
        const diceResult = document.getElementById('diceResult');
        const diceNumber = document.getElementById('diceNumber');
        
        rollBtn.disabled = true;
        dice.classList.add('rolling');
        diceResult.textContent = "Бросок...";
        diceNumber.textContent = "?";
        this.hideDiceDots();
        
        document.getElementById('getQuestBtn').disabled = true;
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
        let result = Math.floor(Math.random() * 6) + 1;
        if (this.player.careerLevel === 'expert' || this.player.careerLevel === 'leader') {
            result = Math.min(6, result + 1); // +1 к броску для экспертов и лидеров
        }
        
        diceNumber.textContent = result;
        this.createDiceDots(result);
        diceResult.textContent = `Выпало: ${result}`;
        
        // Определяем тип клетки по результату броска
        this.selectCellType(result);
        
        this.isRolling = false;
        rollBtn.disabled = false;
    }

    selectCellType(diceResult) {
        let selectedCellType = null;
        
        // Определяем тип клетки по диапазону кубика
        for (const [cellType, info] of Object.entries(CELL_TYPES)) {
            if (diceResult >= info.diceRange[0] && diceResult <= info.diceRange[1]) {
                selectedCellType = cellType;
                break;
            }
        }
        
        this.currentCellType = selectedCellType;
        this.displayCellType(selectedCellType);
        document.getElementById('getQuestBtn').disabled = false;
        
        this.updateCurrentStep("Тип задания определен! Получите задание");
    }

    displayCellType(cellType) {
        const cellInfo = CELL_TYPES[cellType];
        const cellSection = document.getElementById('cellSection');
        const cellDisplay = document.getElementById('cellDisplay');
        const cellIcon = document.getElementById('cellIcon');
        const cellTypeElement = document.getElementById('cellType');
        const cellDescription = document.getElementById('cellDescription');
        
        // Применяем цветовую схему клетки
        cellSection.className = `cell-section cell-${cellType} fade-in`;
        cellDisplay.className = `cell-display`;
        cellIcon.textContent = cellInfo.icon;
        cellTypeElement.textContent = cellInfo.name;
        cellDescription.textContent = cellInfo.description;
        
        // Анимация появления
        cellSection.style.display = 'block';
    }

    getQuest() {
        if (!this.currentCellType) return;
        
        const quests = QUESTS[this.currentCellType];
        const randomQuest = quests[Math.floor(Math.random() * quests.length)];
        this.currentQuest = randomQuest;
        this.displayQuest(randomQuest);
        
        document.getElementById('getQuestBtn').disabled = true;
        document.getElementById('completionButtons').style.display = 'grid';
        
        this.updateCurrentStep("Выполните задание и отметьте результат");
    }

    displayQuest(quest) {
        const questElement = document.getElementById('currentQuest');
        const instructionsElement = document.getElementById('instructionsText');
        const rewardsElement = document.getElementById('rewardsText');
        const difficultyElement = document.getElementById('questDifficulty');
        
        // Анимация появления
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

    completeQuest(success) {
        if (!this.currentQuest) return;
        
        let reputationChange = 0;
        let message = "";
        
        if (success) {
            // Проверяем наличие нужных навыков
            const hasRequiredSkill = this.currentQuest.requiredSkills.some(skill => 
                this.player.skills.includes(skill)
            );
            
            if (hasRequiredSkill) {
                reputationChange = 2;
                message = "Отлично! Вы использовали свой навык и получили +2 Репутации!";
            } else {
                reputationChange = 1;
                message = "Хорошая работа! Вы аргументировали решение и получили +1 Репутации!";
            }
            
            // Бонус за ресурс "Убеждение"
            if (this.player.resource === 'persuade' && !this.player.usedResource) {
                reputationChange += 2;
                this.player.usedResource = true;
                message += " Бонус за использование ресурса 'Убеждение': +2 Репутации!";
            }
        } else {
            message = "Задание не выполнено. Попробуйте в следующий раз!";
        }
        
        // Обновляем репутацию
        this.player.reputation += reputationChange;
        
        // Проверяем повышение уровня
        this.checkLevelUp();
        
        // Добавляем в историю
        this.addToHistory(success, reputationChange);
        
        // Обновляем интерфейс
        this.updatePlayerProfile();
        this.updateStats();
        
        // Сбрасываем состояние
        document.getElementById('completionButtons').style.display = 'none';
        document.getElementById('getQuestBtn').disabled = true;
        
        this.updateCurrentStep(success ? "Задание выполнено! Бросьте кубик снова" : "Задание не выполнено. Бросьте кубик снова");
        
        // Показываем сообщение о результате
        alert(message);
    }

    checkLevelUp() {
        const levels = Object.entries(CAREER_LEVELS);
        for (const [level, info] of levels) {
            if (this.player.reputation >= info.reputation && level !== this.player.careerLevel) {
                this.player.careerLevel = level;
                this.updatePlayerProfile();
                
                if (level === 'specialist' || level === 'expert' || level === 'leader') {
                    alert(`🎉 Поздравляем! Вы достигли уровня "${info.name}"! ${info.bonus}`);
                }
                break;
            }
        }
    }

    addToHistory(success, reputationChange) {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${this.currentCellType}`;
        
        const resultIcon = success ? '✅' : '❌';
        const changeText = reputationChange > 0 ? `+${reputationChange} Репутации` : 'Без изменений';
        
        historyItem.innerHTML = `
            <strong>${this.currentQuest.title}</strong><br>
            <small>${resultIcon} ${changeText} | ${CELL_TYPES[this.currentCellType].name}</small>
        `;
        
        const history = document.getElementById('history');
        history.insertBefore(historyItem, history.firstChild);
        
        // Сохраняем в массив истории
        this.gameHistory.unshift({
            title: this.currentQuest.title,
            cellType: this.currentCellType,
            success: success,
            reputationChange: reputationChange,
            timestamp: new Date().toLocaleTimeString()
        });
        
        // Ограничиваем историю 8 последними записями
        if (this.gameHistory.length > 8) {
            this.gameHistory.pop();
            if (history.children.length > 8) {
                history.removeChild(history.lastChild);
            }
        }
    }

    updateStats() {
        // Можно добавить дополнительную статистику при необходимости
    }

    showWelcomeState() {
        this.updateCurrentStep("Создайте персонажа для начала игры");
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
        
        questElement.textContent = "Сначала определите тип задания!";
        instructionsElement.textContent = "• Бросьте кубик для определения типа клетки\n• Получите профессиональный вызов\n• Выполните задание и отметьте результат";
        rewardsElement.textContent = "• Репутация и профессиональный рост\n• Новые навыки и компетенции\n• Карьерное развитие";
        difficultyElement.textContent = "Сложность: -";
    }
}

// Запуск игры когда страница загружена
document.addEventListener('DOMContentLoaded', () => {
    new ProfessionalTrackGame();
});