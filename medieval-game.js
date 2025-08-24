class MedievalIntrigueGame {
    constructor() {
        this.turn = 1;
        this.maxTurns = GAME_CONFIG.GAME_SETTINGS.MAX_TURNS;
        this.winCondition = GAME_CONFIG.GAME_SETTINGS.WIN_CONDITION;
        this.players = [];
        this.gameLog = [];
        this.selectedAction = null;
        
        this.actions = GAME_CONFIG.ACTIONS;
        this.familyNames = GAME_CONFIG.FAMILY_NAMES;
        
        this.initGame();
    }
    
    initGame() {
        this.turn = 1;
        this.players = [];
        this.gameLog = [];
        this.selectedAction = null;
        
        // Create human player
        this.players.push({
            id: 0,
            name: this.familyNames[0],
            isHuman: true,
            prestige: GAME_CONFIG.GAME_SETTINGS.STARTING_PRESTIGE,
            action: null,
            protected: false
        });
        
        // Create AI players
        for (let i = 1; i < GAME_CONFIG.GAME_SETTINGS.TOTAL_PLAYERS; i++) {
            this.players.push({
                id: i,
                name: this.familyNames[i],
                isHuman: false,
                prestige: GAME_CONFIG.GAME_SETTINGS.STARTING_PRESTIGE,
                action: null,
                protected: false
            });
        }
        
        this.hideGameOver();
        this.renderGame();
        this.addLogEntry(GAME_CONFIG.UI_TEXT.GAME_START_MESSAGE(this.winCondition));
    }
    
    renderGame() {
        this.renderPlayers();
        this.renderActions();
        this.renderTurnInfo();
        this.renderLog();
    }
    
    renderPlayers() {
        const grid = document.getElementById(GAME_CONFIG.DOM_IDS.PLAYERS_GRID);
        grid.innerHTML = '';
        
        // Sort players by prestige (descending)
        const sortedPlayers = [...this.players].sort((a, b) => b.prestige - a.prestige);
        
        sortedPlayers.forEach(player => {
            const card = document.createElement('div');
            card.className = `${GAME_CONFIG.CSS_CLASSES.PLAYER_CARD} ${player.isHuman ? GAME_CONFIG.CSS_CLASSES.PLAYER_CARD_HUMAN : ''} ${player.prestige >= this.winCondition ? GAME_CONFIG.CSS_CLASSES.PLAYER_CARD_WINNER : ''}`;
            
            const actionText = player.action 
                ? `${GAME_CONFIG.UI_TEXT.PLAYER_STATUS.LAST_ACTION} ${this.actions[player.action].name}`
                : GAME_CONFIG.UI_TEXT.PLAYER_STATUS.AWAITING_ACTION;
            
            card.innerHTML = `
                <div class="player-name">
                    ${player.name}
                    <span class="player-type">${player.isHuman ? GAME_CONFIG.UI_TEXT.PLAYER_STATUS.YOU_LABEL : GAME_CONFIG.UI_TEXT.PLAYER_STATUS.AI_LABEL}</span>
                </div>
                <div class="prestige-score">👑 ${player.prestige} Prestige</div>
                <div class="player-action">${actionText}</div>
            `;
            
            grid.appendChild(card);
        });
    }
    
    renderActions() {
        const grid = document.getElementById(GAME_CONFIG.DOM_IDS.ACTIONS_GRID);
        grid.innerHTML = '';
        
        Object.entries(this.actions).forEach(([key, action]) => {
            const button = document.createElement('button');
            button.className = `${GAME_CONFIG.CSS_CLASSES.ACTION_BUTTON} ${this.selectedAction === key ? GAME_CONFIG.CSS_CLASSES.ACTION_BUTTON_SELECTED : ''}`;
            button.onclick = () => this.selectAction(key);
            
            button.innerHTML = `
                <div class="action-title">${action.name}</div>
                <div class="action-description">${action.description}</div>
            `;
            
            grid.appendChild(button);
        });
        
        const executeBtn = document.getElementById(GAME_CONFIG.DOM_IDS.EXECUTE_TURN_BTN);
        executeBtn.disabled = !this.selectedAction;
    }
    
    renderTurnInfo() {
        document.getElementById(GAME_CONFIG.DOM_IDS.TURN_NUMBER).textContent = this.turn;
    }
    
    renderLog() {
        const log = document.getElementById(GAME_CONFIG.DOM_IDS.GAME_LOG);
        log.innerHTML = this.gameLog.map(entry => 
            `<div class="${GAME_CONFIG.CSS_CLASSES.LOG_ENTRY} ${entry.type}">${entry.message}</div>`
        ).join('');
        log.scrollTop = log.scrollHeight;
    }
    
    selectAction(actionKey) {
        this.selectedAction = actionKey;
        this.renderActions();
    }
    
    getAIAction(player) {
        const actions = Object.keys(this.actions);
        const highestPlayer = [...this.players].sort((a, b) => b.prestige - a.prestige)[0];
        const playerRank = [...this.players].sort((a, b) => b.prestige - a.prestige).findIndex(p => p.id === player.id);
        
        // AI strategy based on position and situation
        if (player.prestige >= this.winCondition - GAME_CONFIG.AI_STRATEGY.WIN_THRESHOLD_DISTANCE) {
            // Close to winning - play it safe
            return Math.random() < GAME_CONFIG.AI_STRATEGY.DEFENSIVE_PROBABILITY ? 'protect' : 'invest';
        } else if (playerRank === GAME_CONFIG.AI_STRATEGY.LEADER_RANK) {
            // Leading - protect or invest
            return Math.random() < GAME_CONFIG.AI_STRATEGY.LEADING_PROTECT_PROBABILITY ? 'protect' : 'invest';
        } else if (playerRank >= GAME_CONFIG.AI_STRATEGY.BEHIND_RANK_THRESHOLD) {
            // Behind - take risks
            const riskActions = GAME_CONFIG.AI_STRATEGY.RISK_ACTIONS;
            return riskActions[Math.floor(Math.random() * riskActions.length)];
        } else {
            // Middle ground - balanced strategy
            const weights = GAME_CONFIG.AI_STRATEGY.BALANCED_WEIGHTS;
            
            const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
            let random = Math.random() * total;
            
            for (const [action, weight] of Object.entries(weights)) {
                random -= weight;
                if (random <= 0) return action;
            }
            
            return 'invest'; // fallback
        }
    }
    
    executeTurn() {
        if (!this.selectedAction) return;
        
        // Set human player action
        this.players[0].action = this.selectedAction;
        
        // Set AI actions
        for (let i = 1; i < this.players.length; i++) {
            this.players[i].action = this.getAIAction(this.players[i]);
        }
        
        // Clear protection status from previous turn
        this.players.forEach(player => player.protected = false);
        
        // Group actions by type
        const actionGroups = {};
        this.players.forEach(player => {
            if (!actionGroups[player.action]) {
                actionGroups[player.action] = [];
            }
            actionGroups[player.action].push(player);
        });
        
        // Execute actions in priority order
        const actionOrder = Object.keys(this.actions).sort((a, b) => 
            this.actions[a].priority - this.actions[b].priority
        );
        
        this.addLogEntry(GAME_CONFIG.UI_TEXT.TURN_RESULT_HEADER(this.turn), GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_TURN);
        
        actionOrder.forEach(actionKey => {
            if (actionGroups[actionKey]) {
                this.executeAction(actionKey, actionGroups[actionKey], actionGroups);
            }
        });
        
        // Check win condition
        const winner = this.players.find(player => player.prestige >= this.winCondition);
        if (winner || this.turn >= this.maxTurns) {
            this.endGame(winner);
            return;
        }
        
        this.turn++;
        this.selectedAction = null;
        this.renderGame();
    }
    
    executeAction(actionKey, players, allGroups) {
        const action = this.actions[actionKey];
        
        switch (actionKey) {
            case 'protect':
                players.forEach(player => {
                    player.prestige += action.points;
                    player.protected = true;
                    this.addLogEntry(
                        GAME_CONFIG.UI_TEXT.ACTION_RESULTS.PROTECT(player.name, action.points),
                        GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_ACTION
                    );
                });
                break;
                
            case 'rumor':
                players.forEach(player => {
                    const maxPrestige = Math.max(...this.players.map(p => p.prestige));
                    const topPlayers = this.players.filter(p => !p.protected && p.prestige === maxPrestige);

                    // Pick random among top players (excluding self)
                    const possibleTargets = topPlayers.filter(p => p.id !== player.id);

                    const highestPlayer = possibleTargets.length > 0
                        ? possibleTargets[Math.floor(Math.random() * possibleTargets.length)]
                        : null;

                    if (highestPlayer) {
                        highestPlayer.prestige -= action.damage;
                        player.prestige += action.points;
                        this.addLogEntry(
                            GAME_CONFIG.UI_TEXT.ACTION_RESULTS.RUMOR_SUCCESS(
                                player.name, 
                                highestPlayer.name, 
                                action.damage, 
                                action.points
                            ),
                            GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_ACTION
                        );
                    } else {
                        this.addLogEntry(
                            GAME_CONFIG.UI_TEXT.ACTION_RESULTS.RUMOR_FAIL(player.name),
                            GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_ACTION
                        );
                    }
                });
                break;
                
            case 'favor':
                if (players.length === 1) {
                    players[0].prestige += action.points;
                    this.addLogEntry(
                        GAME_CONFIG.UI_TEXT.ACTION_RESULTS.FAVOR_EXCLUSIVE(players[0].name, action.points),
                        GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_ACTION
                    );
                } else {
                    players.forEach(player => {
                        player.prestige -= action.penalty;
                        this.addLogEntry(
                            GAME_CONFIG.UI_TEXT.ACTION_RESULTS.FAVOR_COMPETE(player.name, action.penalty),
                            GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_ACTION
                        );
                    });
                }
                break;
                
            case 'campaign':
                if (players.length === 1) {
                    this.addLogEntry(
                        GAME_CONFIG.UI_TEXT.ACTION_RESULTS.CAMPAIGN_ALONE(players[0].name),
                        GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_ACTION
                    );
                } else {
                    const bonus = action.points * players.length;
                    players.forEach(player => {
                        player.prestige += bonus;
                        this.addLogEntry(
                            GAME_CONFIG.UI_TEXT.ACTION_RESULTS.CAMPAIGN_GROUP(
                                player.name, 
                                bonus, 
                                players.length
                            ),
                            GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_ACTION
                        );
                    });
                }
                break;
                
            case 'invest':
                players.forEach(player => {
                    player.prestige += action.points;
                    this.addLogEntry(
                        GAME_CONFIG.UI_TEXT.ACTION_RESULTS.INVEST(player.name, action.points),
                        GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_ACTION
                    );
                });
                break;
                
            case 'bank':
                const investorCount = allGroups['invest'] ? allGroups['invest'].length : 0;
                players.forEach(player => {
                    const bonus = action.points * investorCount;
                    player.prestige += bonus;
                    this.addLogEntry(
                        GAME_CONFIG.UI_TEXT.ACTION_RESULTS.BANK(player.name, bonus, investorCount),
                        GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_ACTION
                    );
                });
                break;
        }
        
        // Ensure prestige doesn't go below 0
        this.players.forEach(player => {
            if (player.prestige < 0) player.prestige = 0;
        });
    }
    
    endGame(winner) {
        const gameOverDiv = document.getElementById(GAME_CONFIG.DOM_IDS.GAME_OVER);
        const winnerText = document.getElementById(GAME_CONFIG.DOM_IDS.WINNER_TEXT);
        
        if (winner) {
            if (winner.isHuman) {
                const messages = GAME_CONFIG.UI_TEXT.VICTORY_MESSAGES.HUMAN_WIN;
                winnerText.innerHTML = `
                    <div style="font-size: 1.5em; margin-bottom: 15px;">${messages.title}</div>
                    <div>${messages.message}</div>
                    <div style="margin-top: 15px;"><strong>${winner.name}</strong> achieves victory with <strong>${winner.prestige} prestige</strong>!</div>
                `;
            } else {
                const messages = GAME_CONFIG.UI_TEXT.VICTORY_MESSAGES.AI_WIN;
                winnerText.innerHTML = `
                    <div style="font-size: 1.5em; margin-bottom: 15px;">${messages.title}</div>
                    <div><strong>${winner.name}</strong> has outmaneuvered all rivals and risen to prominence at court!</div>
                    <div style="margin-top: 15px;">Final prestige: <strong>${winner.prestige}</strong></div>
                    <div style="margin-top: 10px; opacity: 0.8;">${messages.subtitle}</div>
                `;
            }
        } else {
            const topPlayer = [...this.players].sort((a, b) => b.prestige - a.prestige)[0];
            const messages = GAME_CONFIG.UI_TEXT.VICTORY_MESSAGES.TIME_LIMIT;
            winnerText.innerHTML = `
                <div style="font-size: 1.5em; margin-bottom: 15px;">${messages.title}</div>
                <div>${messages.message(this.maxTurns)}, <strong>${topPlayer.name}</strong> holds the most influence!</div>
                <div style="margin-top: 15px;">Final prestige: <strong>${topPlayer.prestige}</strong></div>
            `;
        }
        
        gameOverDiv.style.display = 'flex';
        this.addLogEntry(
            `Game Over! ${winner ? winner.name + ' wins!' : 'Time limit reached!'}`, 
            GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_TURN
        );
    }
    
    hideGameOver() {
        document.getElementById(GAME_CONFIG.DOM_IDS.GAME_OVER).style.display = 'none';
    }
    
    addLogEntry(message, type = GAME_CONFIG.CSS_CLASSES.LOG_ENTRY_ACTION) {
        this.gameLog.push({ message, type });
        if (this.gameLog.length > GAME_CONFIG.GAME_SETTINGS.MAX_LOG_ENTRIES) {
            this.gameLog.shift(); // Keep log from getting too long
        }
    }
}

// Initialize game
let game;

function initGame() {
    game = new MedievalIntrigueGame();
}

// Start the game when page loads
window.addEventListener('load', initGame);

// Add event listener for execute turn button
document.addEventListener('DOMContentLoaded', function() {
    const executeBtn = document.getElementById(GAME_CONFIG.DOM_IDS.EXECUTE_TURN_BTN);
    if (executeBtn) {
        executeBtn.addEventListener('click', () => {
            if (game) {
                game.executeTurn();
            }
        });
    }
});