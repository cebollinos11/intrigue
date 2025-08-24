class MedievalIntrigueGame {
    constructor() {
        this.turn = 1;
        this.maxTurns = 20;
        this.winCondition = 20;
        this.players = [];
        this.gameLog = [];
        this.selectedAction = null;
        
        this.actions = {
            'protect': {
                name: 'Protect Reputation',
                description: 'Guard against rumors (+2 prestige, immune to rumors)',
                priority: 1,
                points: 2
            },
            'rumor': {
                name: 'Start Rumor',
                description: 'Spread gossip about the leader (-3 from highest, +1 to you)',
                priority: 2,
                points: 1
            },
            'favor': {
                name: "King's Favor",
                description: 'Seek royal blessing (+8 if alone, -2 if multiple)',
                priority: 3,
                points: 8
            },
            'campaign': {
                name: 'Campaign',
                description: 'Rally supporters (+3 per participant, 0 if alone)',
                priority: 4,
                points: 3
            },
            'invest': {
                name: 'Invest',
                description: 'Develop resources (+2 prestige)',
                priority: 5,
                points: 2
            },
            'bank': {
                name: 'Bank',
                description: 'Lend money (+1 per investor)',
                priority: 6,
                points: 1
            }
        };
        
        this.familyNames = [
            'House Valorian', 'House Drakmoor', 'House Thornwick', 
            'House Ravencrest', 'House Goldmere', 'House Stormwind'
        ];
        
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
            prestige: 5,
            action: null,
            protected: false
        });
        
        // Create AI players
        for (let i = 1; i < 6; i++) {
            this.players.push({
                id: i,
                name: this.familyNames[i],
                isHuman: false,
                prestige: 5,
                action: null,
                protected: false
            });
        }
        
        this.hideGameOver();
        this.renderGame();
        this.addLogEntry(`The noble families gather at court. Each starts with 5 prestige. First to reach ${this.winCondition} prestige wins!`);
    }
    
    renderGame() {
        this.renderPlayers();
        this.renderActions();
        this.renderTurnInfo();
        this.renderLog();
    }
    
    renderPlayers() {
        const grid = document.getElementById('playersGrid');
        grid.innerHTML = '';
        
        // Sort players by prestige (descending)
        const sortedPlayers = [...this.players].sort((a, b) => b.prestige - a.prestige);
        
        sortedPlayers.forEach(player => {
            const card = document.createElement('div');
            card.className = `player-card ${player.isHuman ? 'human' : ''} ${player.prestige >= this.winCondition ? 'winner' : ''}`;
            
            const actionText = player.action 
                ? `Last Action: ${this.actions[player.action].name}`
                : 'Awaiting action...';
            
            card.innerHTML = `
                <div class="player-name">
                    ${player.name}
                    <span class="player-type">${player.isHuman ? 'You' : 'AI'}</span>
                </div>
                <div class="prestige-score">👑 ${player.prestige} Prestige</div>
                <div class="player-action">${actionText}</div>
            `;
            
            grid.appendChild(card);
        });
    }
    
    renderActions() {
        const grid = document.getElementById('actionsGrid');
        grid.innerHTML = '';
        
        Object.entries(this.actions).forEach(([key, action]) => {
            const button = document.createElement('button');
            button.className = `action-button ${this.selectedAction === key ? 'selected' : ''}`;
            button.onclick = () => this.selectAction(key);
            
            button.innerHTML = `
                <div class="action-title">${action.name}</div>
                <div class="action-description">${action.description}</div>
            `;
            
            grid.appendChild(button);
        });
        
        const executeBtn = document.getElementById('executeTurn');
        executeBtn.disabled = !this.selectedAction;
    }
    
    renderTurnInfo() {
        document.getElementById('turnNumber').textContent = this.turn;
    }
    
    renderLog() {
        const log = document.getElementById('gameLog');
        log.innerHTML = this.gameLog.map(entry => 
            `<div class="log-entry ${entry.type}">${entry.message}</div>`
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
        if (player.prestige >= this.winCondition - 3) {
            // Close to winning - play it safe
            return Math.random() < 0.7 ? 'protect' : 'invest';
        } else if (playerRank === 0) {
            // Leading - protect or invest
            return Math.random() < 0.6 ? 'protect' : 'invest';
        } else if (playerRank >= 4) {
            // Behind - take risks
            const riskActions = ['favor', 'rumor', 'campaign'];
            return riskActions[Math.floor(Math.random() * riskActions.length)];
        } else {
            // Middle ground - balanced strategy
            const weights = {
                'protect': 15,
                'rumor': 20,
                'favor': 15,
                'campaign': 20,
                'invest': 15,
                'bank': 15
            };
            
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
        const actionOrder = ['protect', 'rumor', 'favor', 'campaign', 'invest', 'bank'];
        
        this.addLogEntry(`--- Turn ${this.turn} Results ---`, 'turn-result');
        
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
                    this.addLogEntry(`${player.name} protects their reputation (+${action.points} prestige)`, 'action-result');
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
                        highestPlayer.prestige -= 3;
                        player.prestige += action.points;
                        this.addLogEntry(
                            `${player.name} spreads rumors about ${highestPlayer.name} (-3 to ${highestPlayer.name}, +1 to ${player.name})`,
                            'action-result'
                        );
                    } else {
                        this.addLogEntry(
                            `${player.name} fails to spread effective rumors (target protected or self-targeting)`,
                            'action-result'
                        );
                    }
                });
                break;

                
            case 'favor':
                if (players.length === 1) {
                    players[0].prestige += action.points;
                    this.addLogEntry(`${players[0].name} gains exclusive royal favor (+${action.points} prestige)`, 'action-result');
                } else {
                    players.forEach(player => {
                        player.prestige -= 2;
                        this.addLogEntry(`${player.name} competes for king's favor (-2 prestige due to competition)`, 'action-result');
                    });
                }
                break;
                
            case 'campaign':
                if (players.length === 1) {
                    this.addLogEntry(`${players[0].name} campaigns alone (no effect)`, 'action-result');
                } else {
                    const bonus = action.points * players.length;
                    players.forEach(player => {
                        player.prestige += bonus;
                        this.addLogEntry(`${player.name} joins campaign (+${bonus} prestige from ${players.length} participants)`, 'action-result');
                    });
                }
                break;
                
            case 'invest':
                players.forEach(player => {
                    player.prestige += action.points;
                    this.addLogEntry(`${player.name} invests in resources (+${action.points} prestige)`, 'action-result');
                });
                break;
                
            case 'bank':
                const investorCount = allGroups['invest'] ? allGroups['invest'].length : 0;
                players.forEach(player => {
                    const bonus = action.points * investorCount;
                    player.prestige += bonus;
                    this.addLogEntry(`${player.name} provides banking services (+${bonus} prestige from ${investorCount} investors)`, 'action-result');
                });
                break;
        }
        
        // Ensure prestige doesn't go below 0
        this.players.forEach(player => {
            if (player.prestige < 0) player.prestige = 0;
        });
    }
    
    endGame(winner) {
        const gameOverDiv = document.getElementById('gameOver');
        const winnerText = document.getElementById('winnerText');
        
        if (winner) {
            if (winner.isHuman) {
                winnerText.innerHTML = `
                    <div style="font-size: 1.5em; margin-bottom: 15px;">🎉 Congratulations! 🎉</div>
                    <div>You have successfully outmaneuvered your rivals and gained the most influence at court!</div>
                    <div style="margin-top: 15px;"><strong>${winner.name}</strong> achieves victory with <strong>${winner.prestige} prestige</strong>!</div>
                `;
            } else {
                winnerText.innerHTML = `
                    <div style="font-size: 1.5em; margin-bottom: 15px;">👑 Victory Achieved 👑</div>
                    <div><strong>${winner.name}</strong> has outmaneuvered all rivals and risen to prominence at court!</div>
                    <div style="margin-top: 15px;">Final prestige: <strong>${winner.prestige}</strong></div>
                    <div style="margin-top: 10px; opacity: 0.8;">Better luck next time...</div>
                `;
            }
        } else {
            const topPlayer = [...this.players].sort((a, b) => b.prestige - a.prestige)[0];
            winnerText.innerHTML = `
                <div style="font-size: 1.5em; margin-bottom: 15px;">⏰ Time Runs Out ⏰</div>
                <div>After ${this.maxTurns} turns of intrigue, <strong>${topPlayer.name}</strong> holds the most influence!</div>
                <div style="margin-top: 15px;">Final prestige: <strong>${topPlayer.prestige}</strong></div>
            `;
        }
        
        gameOverDiv.style.display = 'flex';
        this.addLogEntry(`Game Over! ${winner ? winner.name + ' wins!' : 'Time limit reached!'}`, 'turn-result');
    }
    
    hideGameOver() {
        document.getElementById('gameOver').style.display = 'none';
    }
    
    addLogEntry(message, type = 'action-result') {
        this.gameLog.push({ message, type });
        if (this.gameLog.length > 50) {
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
    const executeBtn = document.getElementById('executeTurn');
    if (executeBtn) {
        executeBtn.addEventListener('click', () => {
            if (game) {
                game.executeTurn();
            }
        });
    }
});