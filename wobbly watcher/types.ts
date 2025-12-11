export type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

export interface Position {
  x: number;
  y: number;
}

export interface Entity extends Position {
  radius: number;
  color: string;
}

export interface Player extends Entity {
  baseSpeed: number;
  speed: number;
  buffs: {
    speed: number;
    shrink: number;
  };
}

export interface Creature extends Entity {
  baseSpeed: number;
  speed: number;
  angle: number; // For wobbling logic
  wobbleIntensity: number;
  frozenTimer: number;
}

export interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  type?: 'TRAIL' | 'ENV' | 'EXPLOSION';
}

export type BuffType = 'SPEED' | 'SHRINK' | 'FREEZE';

export interface Buff extends Entity {
  type: BuffType;
  life: number;
  maxLife: number;
}

export type HazardType = 'BOMB' | 'SPIKE';

export interface Hazard extends Entity {
  type: HazardType;
  timer: number; // Fuse for bomb, duration for spike
  state: 'WARNING' | 'ACTIVE';
}