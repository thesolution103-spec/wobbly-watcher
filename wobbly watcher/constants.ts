export const GAME_CONSTANTS = {
  PLAYER_RADIUS: 15,
  PLAYER_BASE_SPEED: 0.15,
  PLAYER_BUFF_SPEED: 0.25,
  PLAYER_SHRINK_RADIUS: 8,
  
  CREATURE_RADIUS: 25,
  CREATURE_BASE_SPEED: 2.5,
  CREATURE_SPEED_INCREMENT: 0.0005, // Slower increment but consistent
  
  TAUNT_INTERVAL_MIN: 3000,
  TAUNT_INTERVAL_MAX: 8000,

  // Spawning
  BUFF_SPAWN_CHANCE: 0.002, // approx every 8 seconds at 60fps
  HAZARD_SPAWN_CHANCE_START: 0.005,
  HAZARD_SPAWN_INCREASE: 0.0001,

  // Hazards
  BOMB_FUSE: 120, // 2 seconds
  BOMB_RADIUS: 80,
  SPIKE_DURATION: 300, // 5 seconds
  SPIKE_RADIUS: 20,
};

export const BUFF_COLORS = {
  SPEED: '#00FFFF', // Cyan
  SHRINK: '#FF00FF', // Magenta
  FREEZE: '#0000FF', // Blue
};

export const HAZARD_COLORS = {
  BOMB: '#FF4500', // OrangeRed
  SPIKE: '#808080', // Gray
};

export const CREATURE_TAUNTS = [
  "I just want to count your teeth!",
  "Why are you so squishy?",
  "Stop running, I made cookies! (With bugs)",
  "Do your bones rattle when you shake?",
  "Let me smell your fear... smells like popcorn.",
  "I promise I won't bite... hard.",
  "Hug time!",
  "Are you edible? Asking for a friend.",
  "You run funny. I like it.",
  "Wait! You dropped your shadow!",
  "Squish squish squish.",
  "I have a present for you! It's slime!",
  "Don't be shy, I'm just a nightmare!",
  "My mom says I'm handsome!",
  "Stop moving, you're making me dizzy!",
];

export const CREATURE_COLORS = [
  '#FF0055', // Red-ish
  '#A020F0', // Purple
  '#32CD32', // Lime (Creepy slime)
  '#FF4500', // Orange red
];