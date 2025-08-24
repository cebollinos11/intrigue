// Medieval Intrigue Game Configuration
const GAME_CONFIG = {
    // Core Game Settings
    GAME_SETTINGS: {
        MAX_TURNS: 20,
        WIN_CONDITION: 20,
        STARTING_PRESTIGE: 5,
        TOTAL_PLAYERS: 6,
        AI_PLAYERS: 5,
        MAX_LOG_ENTRIES: 50
    },

    // Player Configuration
    FAMILY_NAMES: [
        'House Valorian',
        'House Drakmoor', 
        'House Thornwick',
        'House Ravencrest',
        'House Goldmere',
        'House Stormwind'
    ],

    // Action Definitions
    ACTIONS: {
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
            points: 1,
            damage: 3
        },
        'favor': {
            name: "King's Favor",
            description: 'Seek royal blessing (+8 if alone, -2 if multiple)',
            priority: 3,
            points: 8,
            penalty: 2
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
    },

    // AI Strategy Configuration
    AI_STRATEGY: {
        // Probability thresholds for different situations
        WIN_THRESHOLD_DISTANCE: 3, // How close to winning before playing defensively
        DEFENSIVE_PROBABILITY: 0.7, // Chance to play defensively when close to winning
        LEADING_PROTECT_PROBABILITY: 0.6, // Chance for leader to protect vs invest
        
        // Action weights for middle-ranking AI players
        BALANCED_WEIGHTS: {
            'protect': 15,
            'rumor': 20,
            'favor': 15,
            'campaign': 20,
            'invest': 15,
            'bank': 15
        },

        // Risk actions for players who are behind
        RISK_ACTIONS: ['favor', 'rumor', 'campaign'],
        
        // Safe actions for leading/close-to-win players
        SAFE_ACTIONS: ['protect', 'invest'],

        // Rank thresholds (0-indexed)
        LEADER_RANK: 0,
        BEHIND_RANK_THRESHOLD: 4 // Players ranked 4th or worse take risks
    },

    // UI Text and Messages
    UI_TEXT: {
        GAME_START_MESSAGE: (winCondition) => 
            `The noble families gather at court. Each starts with 5 prestige. First to reach ${winCondition} prestige wins!`,
        
        TURN_RESULT_HEADER: (turnNumber) => `--- Turn ${turnNumber} Results ---`,
        
        VICTORY_MESSAGES: {
            HUMAN_WIN: {
                title: "🎉 Congratulations! 🎉",
                message: "You have successfully outmaneuvered your rivals and gained the most influence at court!"
            },
            AI_WIN: {
                title: "👑 Victory Achieved 👑",
                subtitle: "Better luck next time..."
            },
            TIME_LIMIT: {
                title: "⏰ Time Runs Out ⏰",
                message: (maxTurns) => `After ${maxTurns} turns of intrigue`
            }
        },

        ACTION_RESULTS: {
            PROTECT: (playerName, points) => 
                `${playerName} protects their reputation (+${points} prestige)`,
            
            RUMOR_SUCCESS: (attackerName, targetName, damage, gain) =>
                `${attackerName} spreads rumors about ${targetName} (-${damage} to ${targetName}, +${gain} to ${attackerName})`,
            
            RUMOR_FAIL: (playerName) =>
                `${playerName} fails to spread effective rumors (target protected or self-targeting)`,
            
            FAVOR_EXCLUSIVE: (playerName, points) =>
                `${playerName} gains exclusive royal favor (+${points} prestige)`,
            
            FAVOR_COMPETE: (playerName, penalty) =>
                `${playerName} competes for king's favor (-${penalty} prestige due to competition)`,
            
            CAMPAIGN_ALONE: (playerName) =>
                `${playerName} campaigns alone (no effect)`,
            
            CAMPAIGN_GROUP: (playerName, bonus, participantCount) =>
                `${playerName} joins campaign (+${bonus} prestige from ${participantCount} participants)`,
            
            INVEST: (playerName, points) =>
                `${playerName} invests in resources (+${points} prestige)`,
            
            BANK: (playerName, bonus, investorCount) =>
                `${playerName} provides banking services (+${bonus} prestige from ${investorCount} investors)`
        },

        PLAYER_STATUS: {
            AWAITING_ACTION: "Awaiting action...",
            LAST_ACTION: "Last Action:",
            YOU_LABEL: "You",
            AI_LABEL: "AI"
        }
    },

    // CSS Classes
    CSS_CLASSES: {
        PLAYER_CARD: "player-card",
        PLAYER_CARD_HUMAN: "human",
        PLAYER_CARD_WINNER: "winner",
        ACTION_BUTTON: "action-button",
        ACTION_BUTTON_SELECTED: "selected",
        LOG_ENTRY: "log-entry",
        LOG_ENTRY_TURN: "turn-result",
        LOG_ENTRY_ACTION: "action-result"
    },

    // DOM Element IDs
    DOM_IDS: {
        PLAYERS_GRID: "playersGrid",
        ACTIONS_GRID: "actionsGrid",
        EXECUTE_TURN_BTN: "executeTurn",
        TURN_NUMBER: "turnNumber",
        GAME_LOG: "gameLog",
        GAME_OVER: "gameOver",
        WINNER_TEXT: "winnerText"
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_CONFIG;
}