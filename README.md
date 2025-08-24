# intrigue
Medieval intrigue game

Develop the code for a web game using vanilla javascript. The game is a medieval intrigue game where players can take one action per turn.
Each player is a noble family in a medieval city vying for influence at court. The King is old and manipulable, so everyone tries to gain prestige, undermine rivals, and maneuver alliances.

The game starts with all players 6 with 5 Prestige points. One is human player the other 5 are ai controlled.

Each player takes an action at the same time, then they get resolved by priority order.

The actions are (in priority order):

Protect reputation: gain small points and protect about rumors.
Start rumor: steals small points from the opponent with the highest points (unless they chose Protect reputation)
Kings favor: gain big points if only 1 player selected this, otherwise remove points. 
Campaign: zero points if alone, but more points the more people that choose this. 
Invest: gain small points
Bank: gain small points per player that chose invest

provide me with html, javascript, and css files