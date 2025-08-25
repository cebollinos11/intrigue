
// Firebase configuration - REPLACE WITH YOUR CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyASsaGcx_0wzbXSTKobgEsBpNnNgG0_v6A",
    authDomain: "medievalintrigueclaude.firebaseapp.com",
    projectId: "medievalintrigueclaude",
    databaseURL: "https://medievalintrigueclaude-default-rtdb.europe-west1.firebasedatabase.app/",  // Make sure this matches exactly from Firebase Console

    storageBucket: "medievalintrigueclaude.firebasestorage.app",
    messagingSenderId: "712288326971",
    appId: "1:712288326971:web:8813d07c7b0892b3a4d31e",
    measurementId: "G-F5LSNG913W"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Game configuration
const GAME_CONFIG = {
    ACTIONS: {
        protect: { name: "🛡️ Protect", description: "Gain 2 prestige and immunity", points: 2, priority: 1 },
        rumor: { name: "👥 Spread Rumors", description: "Damage rival, gain prestige", damage: 3, points: 2, priority: 2 },
        favor: { name: "💰 Court Favor", description: "Exclusive: +4, Contested: -2", points: 4, penalty: 2, priority: 3 },
        campaign: { name: "🤝 Campaign", description: "Collaborate for bonus prestige", points: 3, priority: 4 },
        invest: { name: "📈 Invest", description: "Steady +3 prestige gain", points: 3, priority: 5 },
        bank: { name: "🏦 Banking", description: "Profit from others' investments", points: 2, priority: 6 }
    },
    GAME_SETTINGS: {
        MIN_PLAYERS: 2,
        MAX_PLAYERS: 6,
        STARTING_PRESTIGE: 10,
        WIN_CONDITION: 25,
        MAX_TURNS: 15,
        MAX_LOG_ENTRIES: 50
    }
};

class MultiplayerMedievalGame {
    constructor() {
        this.playerId = null;
        this.playerName = '';
        this.roomCode = '';
        this.gameRef = null;
        this.isHost = false;
        this.selectedAction = null;
        this.gameState = null;
        
        this.initializeUI();

        //reconnect feature
            //rejoin feature
        const savedId = localStorage.getItem("playerId");
        const savedName = localStorage.getItem("playerName");
        const savedRoom = localStorage.getItem("roomCode");
        const savedHost = localStorage.getItem("isHost");
        if (savedId && savedRoom && savedName) {
            this.playerId = savedId;
            this.playerName = savedName;
            this.roomCode = savedRoom;
            this.isHost = savedHost === "true";

            this.gameRef = database.ref(`rooms/${this.roomCode}`);
            this.showRoomInfo();
            this.listenToRoom();
        }
    }

    initializeUI() {
        document.getElementById('createRoomBtn').onclick = () => this.createRoom();
        document.getElementById('joinRoomBtn').onclick = () => this.showJoinRoom();
        document.getElementById('startGameBtn').onclick = () => this.startGame();
        document.getElementById('executeTurn').onclick = () => this.submitAction();

        // Handle room code input
        document.getElementById('roomCodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });

        document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createRoom();
            }
        });
    }

    async createRoom() {
        const nameInput = document.getElementById('playerNameInput');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Please enter your family name');
            return;
        }

        this.playerName = name;
        this.playerId = this.generatePlayerId();
        this.roomCode = this.generateRoomCode();
        this.isHost = true;

        // Create room in Firebase
        const roomRef = database.ref(`rooms/${this.roomCode}`);
        await roomRef.set({
            host: this.playerId,
            created: Date.now(),
            gameState: 'lobby',
            players: {
                [this.playerId]: {
                    name: this.playerName,
                    ready: true,
                    joinedAt: Date.now()
                }
            }
        });

        this.gameRef = roomRef;
        this.showRoomInfo();
        this.listenToRoom();
        localStorage.setItem("playerId", this.playerId);
        localStorage.setItem("playerName", this.playerName);
        localStorage.setItem("roomCode", this.roomCode);
        localStorage.setItem("isHost", this.isHost ? "true" : "false");

    }

    showJoinRoom() {
        const roomCodeInput = document.getElementById('roomCodeInput');
        roomCodeInput.style.display = 'block';
        roomCodeInput.focus();

        // Add join button functionality
        const joinBtn = document.getElementById('joinRoomBtn');
        joinBtn.textContent = 'Connect';
        joinBtn.onclick = () => this.joinRoom();
    }

    async joinRoom() {
        const nameInput = document.getElementById('playerNameInput');
        const roomCodeInput = document.getElementById('roomCodeInput');
        const name = nameInput.value.trim();
        const code = roomCodeInput.value.trim().toUpperCase();

        if (!name || !code) {
            alert('Please enter both your name and room code');
            return;
        }

        this.playerName = name;
        this.playerId = this.generatePlayerId();
        this.roomCode = code;

        // Check if room exists
        const roomRef = database.ref(`rooms/${this.roomCode}`);
        const snapshot = await roomRef.once('value');
        
        if (!snapshot.exists()) {
            alert('Room not found. Please check the code.');
            return;
        }

        const roomData = snapshot.val();
        const playerCount = Object.keys(roomData.players || {}).length;

        if (playerCount >= GAME_CONFIG.GAME_SETTINGS.MAX_PLAYERS) {
            alert('Room is full');
            return;
        }

        if (roomData.gameState !== 'lobby') {
            alert('Game has already started');
            return;
        }

        // Add player to room
        await roomRef.child(`players/${this.playerId}`).set({
            name: this.playerName,
            ready: true,
            joinedAt: Date.now()
        });

        this.gameRef = roomRef;
        this.showRoomInfo();
        this.listenToRoom();
        localStorage.setItem("playerId", this.playerId);
        localStorage.setItem("playerName", this.playerName);
        localStorage.setItem("roomCode", this.roomCode);
        localStorage.setItem("isHost", this.isHost ? "true" : "false");

    }

    showRoomInfo() {
        document.getElementById('roomCodeDisplay').textContent = this.roomCode;
        document.getElementById('roomInfo').style.display = 'block';
        
        if (this.isHost) {
            document.getElementById('startGameBtn').style.display = 'block';
        } 
    }

    listenToRoom() {
        this.gameRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            this.updateLobby(data);

            if (data.gameState === 'playing') {
                this.gameState = data.game;
                this.showGameBoard();
                this.updateGameDisplay();
            }
        });
    }

    updateLobby(roomData) {
        const waitingPlayers = document.getElementById('waitingPlayers');
        waitingPlayers.innerHTML = '';

        Object.entries(roomData.players || {}).forEach(([id, player]) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = `waiting-player ${player.ready ? 'ready' : ''}`;
            playerDiv.innerHTML = `
                ${player.name} ${id === roomData.host ? '(Host)' : ''}
                ${player.ready ? '✅ Ready' : '⏳ Not Ready'}
            `;
            waitingPlayers.appendChild(playerDiv);
        });

        // Update start button visibility for host
        if (this.isHost) {
            const allReady = Object.values(roomData.players || {}).every(p => p.ready);
            const playerCount = Object.keys(roomData.players || {}).length;
            const startBtn = document.getElementById('startGameBtn');
            startBtn.style.display = (allReady && playerCount >= GAME_CONFIG.GAME_SETTINGS.MIN_PLAYERS) ? 'block' : 'none';
        }
    }



    async startGame() {
        const snapshot = await this.gameRef.once('value');
        const roomData = snapshot.val();
        const players = Object.entries(roomData.players || {}).map(([id, data], index) => ({
            id,
            name: data.name,
            prestige: GAME_CONFIG.GAME_SETTINGS.STARTING_PRESTIGE,
            action: null,
            protected: false,
            isHuman: true,
            submitted: false
        }));

        const gameState = {
            turn: 1,
            maxTurns: GAME_CONFIG.GAME_SETTINGS.MAX_TURNS,
            winCondition: GAME_CONFIG.GAME_SETTINGS.WIN_CONDITION,
            players,
            gameLog: [],
            phase: 'action_selection', // 'action_selection', 'waiting_for_players', 'resolving'
            winner: null
        };

        await this.gameRef.update({
            gameState: 'playing',
            game: gameState
        });
    }

    showGameBoard() {
        document.getElementById('lobbyScreen').classList.remove('active');
        document.getElementById('gameBoard').classList.add('active');
        this.renderActions();
    }

    renderActions() {
        const grid = document.getElementById('actionsGrid');
        grid.innerHTML = '';
        
        Object.entries(GAME_CONFIG.ACTIONS).forEach(([key, action]) => {
            const button = document.createElement('button');
            button.className = `action-button ${this.selectedAction === key ? 'selected' : ''}`;
            button.onclick = () => this.selectAction(key);
            
            button.innerHTML = `
                <div class="action-title">${action.name}</div>
                <div class="action-description">${action.description}</div>
            `;
            
            grid.appendChild(button);
        });
    }

    selectAction(actionKey) {
        this.selectedAction = actionKey;
        this.renderActions();
        document.getElementById('executeTurn').disabled = false;
    }

    async submitAction() {
        if (!this.selectedAction || !this.gameState) return;

        // Mark player as submitted and set their action
        const playerUpdates = {};
        playerUpdates[`game/players/${this.getPlayerIndex()}/action`] = this.selectedAction;
        playerUpdates[`game/players/${this.getPlayerIndex()}/submitted`] = true;

        await this.gameRef.update(playerUpdates);

        this.selectedAction = null;
        document.getElementById('executeTurn').disabled = true;
        this.renderActions();
    }

    getPlayerIndex() {
        return this.gameState.players.findIndex(p => p.id === this.playerId);
    }

    updateGameDisplay() {
        if (!this.gameState) return;

        // Update turn number
        document.getElementById('turnNumber').textContent = this.gameState.turn;

        // Update turn status
        const allSubmitted = this.gameState.players.every(p => p.submitted);
        const myPlayer = this.gameState.players.find(p => p.id === this.playerId);
        
        let statusText = '';
        if (myPlayer && myPlayer.submitted) {
            statusText = allSubmitted ? 'All actions submitted! Resolving...' : 'Waiting for other players...';
        } else {
            statusText = 'Choose your action wisely, noble lord...';
        }
        document.getElementById('turnStatus').textContent = statusText;

        // Check if all players have submitted and resolve turn (only host does this)
        if (this.isHost && allSubmitted && this.gameState.phase === 'action_selection') {
            this.resolveTurn();
        }

        this.renderPlayers();
        this.renderLog();

        // Check for game over
        if (this.gameState.winner || this.gameState.turn > this.gameState.maxTurns) {
            this.showGameOver();
        }
    }

    async resolveTurn() {
        // Set phase to resolving to prevent multiple resolutions
        await this.gameRef.child('game/phase').set('resolving');

        const newGameState = { ...this.gameState };

            // Ensure gameLog exists and is an array
        if (!newGameState.gameLog || !Array.isArray(newGameState.gameLog)) {
            newGameState.gameLog = [];
        }
        
        // Clear protection status from previous turn
        newGameState.players.forEach(player => player.protected = false);
        
        // Group actions by type
        const actionGroups = {};
        newGameState.players.forEach(player => {
            if (!actionGroups[player.action]) {
                actionGroups[player.action] = [];
            }
            actionGroups[player.action].push(player);
        });
        
        // Execute actions in priority order
        const actionOrder = Object.keys(GAME_CONFIG.ACTIONS).sort((a, b) => 
            GAME_CONFIG.ACTIONS[a].priority - GAME_CONFIG.ACTIONS[b].priority
        );
        

        newGameState.gameLog.push({
            message: `Turn ${newGameState.turn} Results:`,
            type: 'turn',
            timestamp: Date.now()
        });
        
        actionOrder.forEach(actionKey => {
            if (actionGroups[actionKey]) {
                this.executeAction(actionKey, actionGroups[actionKey], actionGroups, newGameState);
            }
        });
        
        // Check win condition
        const winner = newGameState.players.find(player => player.prestige >= newGameState.winCondition);
        if (winner || newGameState.turn >= newGameState.maxTurns) {
            newGameState.winner = winner;
        } else {
            newGameState.turn++;
            newGameState.players.forEach(player => {
                player.action = null;
                player.submitted = false;
            });
            newGameState.phase = 'action_selection';
        }
        
        await this.gameRef.child('game').set(newGameState);
    }

    executeAction(actionKey, players, allGroups, gameState) {
        const action = GAME_CONFIG.ACTIONS[actionKey];
        
        switch (actionKey) {
            case 'protect':
                players.forEach(player => {
                    player.prestige += action.points;
                    player.protected = true;
                    gameState.gameLog.push({
                        message: `${player.name} fortifies their position, gaining ${action.points} prestige and protection`,
                        type: 'action',
                        timestamp: Date.now()
                    });
                });
                break;
                
            case 'rumor':
                players.forEach(player => {
                    const maxPrestige = Math.max(...gameState.players.map(p => p.prestige));
                    const topPlayers = gameState.players.filter(p => !p.protected && p.prestige === maxPrestige);
                    const possibleTargets = topPlayers.filter(p => p.id !== player.id);

                    if (possibleTargets.length > 0) {
                        const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
                        target.prestige -= action.damage;
                        player.prestige += action.points;
                        gameState.gameLog.push({
                            message: `${player.name} spreads damaging rumors about ${target.name}, dealing ${action.damage} damage and gaining ${action.points} prestige`,
                            type: 'action',
                            timestamp: Date.now()
                        });
                    } else {
                        gameState.gameLog.push({
                            message: `${player.name}'s rumors find no suitable target`,
                            type: 'action',
                            timestamp: Date.now()
                        });
                    }
                });
                break;
                
            case 'favor':
                if (players.length === 1) {
                    players[0].prestige += action.points;
                    gameState.gameLog.push({
                        message: `${players[0].name} gains exclusive court favor, earning ${action.points} prestige`,
                        type: 'action',
                        timestamp: Date.now()
                    });
                } else {
                    players.forEach(player => {
                        player.prestige -= action.penalty;
                        gameState.gameLog.push({
                            message: `${player.name} competes for court favor but loses ${action.penalty} prestige in the struggle`,
                            type: 'action',
                            timestamp: Date.now()
                        });
                    });
                }
                break;
                
            case 'campaign':
                if (players.length === 1) {
                    gameState.gameLog.push({
                        message: `${players[0].name} campaigns alone but gains no benefit`,
                        type: 'action',
                        timestamp: Date.now()
                    });
                } else {
                    const bonus = action.points * players.length;
                    players.forEach(player => {
                        player.prestige += bonus;
                        gameState.gameLog.push({
                            message: `${player.name} joins a ${players.length}-person campaign, earning ${bonus} prestige`,
                            type: 'action',
                            timestamp: Date.now()
                        });
                    });
                }
                break;
                
            case 'invest':
                players.forEach(player => {
                    player.prestige += action.points;
                    gameState.gameLog.push({
                        message: `${player.name} makes wise investments, gaining ${action.points} prestige`,
                        type: 'action',
                        timestamp: Date.now()
                    });
                });
                break;
                
            case 'bank':
                const investorCount = allGroups['invest'] ? allGroups['invest'].length : 0;
                players.forEach(player => {
                    const bonus = action.points * investorCount;
                    player.prestige += bonus;
                    gameState.gameLog.push({
                        message: `${player.name} profits from banking, earning ${bonus} prestige from ${investorCount} investors`,
                        type: 'action',
                        timestamp: Date.now()
                    });
                });
                break;
        }
        
        // Ensure prestige doesn't go below 0
        gameState.players.forEach(player => {
            if (player.prestige < 0) player.prestige = 0;
        });
    }

    renderPlayers() {
        const grid = document.getElementById('playersGrid');
        grid.innerHTML = '';
        
        // Sort players by prestige (descending)
        const sortedPlayers = [...this.gameState.players].sort((a, b) => b.prestige - a.prestige);
        
        sortedPlayers.forEach(player => {
            const card = document.createElement('div');
            const isMyPlayer = player.id === this.playerId;
            const isWinner = player.prestige >= this.gameState.winCondition;
            
            card.className = `player-card ${isMyPlayer ? 'human' : ''} ${isWinner ? 'winner' : ''}`;
            
            let actionText = 'Awaiting action...';
            if (player.submitted) {
                actionText = 'Action submitted ✅';
            } else if (player.action) {
                actionText = `Last: ${GAME_CONFIG.ACTIONS[player.action].name}`;
            }
            
            card.innerHTML = `
                <div class="player-name">
                    ${player.name}
                    <span class="player-type">${isMyPlayer ? 'You' : 'Player'}</span>
                </div>
                <div class="prestige-score">👑 ${player.prestige} Prestige</div>
                <div class="player-action">${actionText}</div>
            `;
            
            grid.appendChild(card);
        });
    }

renderLog() {
    const log = document.getElementById('gameLog');
    const entries = this.gameState.gameLog || []; // fallback if undefined

    log.innerHTML = entries.map(entry =>
        `<div class="log-entry ${entry.type}">${entry.message}</div>`
    ).join('');

    log.scrollTop = log.scrollHeight;
}

    showGameOver() {
        const gameOverDiv = document.getElementById('gameOver');
        const winnerText = document.getElementById('winnerText');
        
        if (this.gameState.winner) {
            const isMyWin = this.gameState.winner.id === this.playerId;
            if (isMyWin) {
                winnerText.innerHTML = `
                    <div style="font-size: 1.5em; margin-bottom: 15px;">Congratulations!</div>
                    <div>You have achieved victory through superior political maneuvering!</div>
                    <div style="margin-top: 15px;"><strong>${this.gameState.winner.name}</strong> wins with <strong>${this.gameState.winner.prestige} prestige</strong>!</div>
                `;
            } else {
                winnerText.innerHTML = `
                    <div style="font-size: 1.5em; margin-bottom: 15px;">Game Over</div>
                    <div><strong>${this.gameState.winner.name}</strong> has outmaneuvered all rivals and risen to prominence at court!</div>
                    <div style="margin-top: 15px;">Final prestige: <strong>${this.gameState.winner.prestige}</strong></div>
                `;
            }
        } else {
            const topPlayer = [...this.gameState.players].sort((a, b) => b.prestige - a.prestige)[0];
            winnerText.innerHTML = `
                <div style="font-size: 1.5em; margin-bottom: 15px;">Time's Up!</div>
                <div>After ${this.gameState.maxTurns} turns of political intrigue, <strong>${topPlayer.name}</strong> holds the most influence!</div>
                <div style="margin-top: 15px;">Final prestige: <strong>${topPlayer.prestige}</strong></div>
            `;
        }
        
        gameOverDiv.style.display = 'flex';
        //remove reconnect info
        localStorage.removeItem("playerId");
        localStorage.removeItem("playerName");
        localStorage.removeItem("roomCode");
        localStorage.removeItem("isHost");
    }

    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    generatePlayerId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}

function returnToLobby() {
    location.reload();
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new MultiplayerMedievalGame();



    

});
