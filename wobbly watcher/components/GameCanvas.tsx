import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Player, Creature, Position, Particle, Buff, Hazard, BuffType, HazardType } from '../types';
import { GAME_CONSTANTS, CREATURE_TAUNTS, CREATURE_COLORS, BUFF_COLORS, HAZARD_COLORS } from '../constants';
import { soundEngine } from '../services/SoundEngine';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: number) => void;
  setTaunt: (text: string | null) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onGameOver, setTaunt }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);

  // --- Game Entities Refs ---
  const playerRef = useRef<Player>({
    x: 0, y: 0,
    radius: GAME_CONSTANTS.PLAYER_RADIUS,
    color: '#4ADE80',
    baseSpeed: GAME_CONSTANTS.PLAYER_BASE_SPEED,
    speed: GAME_CONSTANTS.PLAYER_BASE_SPEED,
    buffs: { speed: 0, shrink: 0 }
  });

  const creatureRef = useRef<Creature>({
    x: -100, y: -100,
    radius: GAME_CONSTANTS.CREATURE_RADIUS,
    color: CREATURE_COLORS[0],
    baseSpeed: GAME_CONSTANTS.CREATURE_BASE_SPEED,
    speed: GAME_CONSTANTS.CREATURE_BASE_SPEED,
    angle: 0,
    wobbleIntensity: 5,
    frozenTimer: 0
  });

  const mouseRef = useRef<Position>({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const buffsRef = useRef<Buff[]>([]);
  const hazardsRef = useRef<Hazard[]>([]);

  // Timers & Difficulty
  const lastTauntTime = useRef<number>(0);
  const nextTauntInterval = useRef<number>(2000);
  const difficultyFactor = useRef<number>(1);

  // Screen Dimensions
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // --- Resize Handler ---
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Initialization ---
  useEffect(() => {
    if (gameState === 'PLAYING') {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      scoreRef.current = 0;
      difficultyFactor.current = 1;

      // Reset Player
      playerRef.current = {
        x: centerX,
        y: centerY,
        radius: GAME_CONSTANTS.PLAYER_RADIUS,
        color: '#4ADE80',
        baseSpeed: GAME_CONSTANTS.PLAYER_BASE_SPEED,
        speed: GAME_CONSTANTS.PLAYER_BASE_SPEED,
        buffs: { speed: 0, shrink: 0 }
      };

      mouseRef.current = { x: centerX, y: centerY };

      // Spawn Creature
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnDist = Math.max(window.innerWidth, window.innerHeight);
      creatureRef.current = {
        x: centerX + Math.cos(spawnAngle) * spawnDist,
        y: centerY + Math.sin(spawnAngle) * spawnDist,
        radius: GAME_CONSTANTS.CREATURE_RADIUS,
        color: CREATURE_COLORS[Math.floor(Math.random() * CREATURE_COLORS.length)],
        baseSpeed: GAME_CONSTANTS.CREATURE_BASE_SPEED,
        speed: GAME_CONSTANTS.CREATURE_BASE_SPEED,
        angle: 0,
        wobbleIntensity: 5,
        frozenTimer: 0
      };

      // Initialize Environment Particles
      const envParticles: Particle[] = [];
      for (let i = 0; i < 50; i++) {
        envParticles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          life: 1,
          color: '#ffffff',
          size: Math.random() * 2,
          type: 'ENV'
        });
      }

      particlesRef.current = envParticles;
      buffsRef.current = [];
      hazardsRef.current = [];
      lastTauntTime.current = Date.now();
    }
  }, [gameState]);

  // --- Input Handling ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // --- Helper: Spawning ---
  const spawnBuff = (width: number, height: number) => {
    const types: BuffType[] = ['SPEED', 'SHRINK', 'FREEZE'];
    const type = types[Math.floor(Math.random() * types.length)];
    buffsRef.current.push({
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
      radius: 10,
      color: BUFF_COLORS[type],
      type: type,
      life: 600, // 10 seconds
      maxLife: 600
    });
  };

  const spawnHazard = (width: number, height: number) => {
    const types: HazardType[] = ['BOMB', 'SPIKE'];
    const type = types[Math.floor(Math.random() * types.length)];
    const margin = 50;

    // Hazards spawn randomly on screen
    hazardsRef.current.push({
      x: Math.random() * (width - margin * 2) + margin,
      y: Math.random() * (height - margin * 2) + margin,
      radius: type === 'BOMB' ? GAME_CONSTANTS.BOMB_RADIUS : GAME_CONSTANTS.SPIKE_RADIUS,
      color: HAZARD_COLORS[type],
      type: type,
      timer: type === 'BOMB' ? GAME_CONSTANTS.BOMB_FUSE : GAME_CONSTANTS.SPIKE_DURATION,
      state: 'WARNING'
    });
  };

  // --- Helper: Create Particles ---
  const createExplosion = (x: number, y: number, color: string, count: number) => {
    for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        particlesRef.current.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: color,
            size: Math.random() * 4 + 2,
            type: 'EXPLOSION'
        });
    }
  }


  // --- Game Loop ---
  const loop = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = Date.now();
    const width = dimensions.width;
    const height = dimensions.height;

    // Difficulty Increase
    scoreRef.current++;
    if (scoreRef.current % 300 === 0) { // Every 5 seconds approx
       difficultyFactor.current += 0.05;
    }

    // Clear
    ctx.clearRect(0, 0, width, height);

    const player = playerRef.current;
    const creature = creatureRef.current;

    // --- 1. Player Logic ---
    // Handle Buff Timers
    if (player.buffs.speed > 0) player.buffs.speed--;
    if (player.buffs.shrink > 0) player.buffs.shrink--;

    // Update Player Stats based on buffs
    player.speed = player.buffs.speed > 0 ? GAME_CONSTANTS.PLAYER_BUFF_SPEED : GAME_CONSTANTS.PLAYER_BASE_SPEED;
    player.radius = player.buffs.shrink > 0 ? GAME_CONSTANTS.PLAYER_SHRINK_RADIUS : GAME_CONSTANTS.PLAYER_RADIUS;

    // Move Player
    const dx = mouseRef.current.x - player.x;
    const dy = mouseRef.current.y - player.y;
    player.x += dx * player.speed;
    player.y += dy * player.speed;

    // Player Trail Particles
    if (scoreRef.current % 4 === 0) {
      particlesRef.current.push({
        x: player.x + (Math.random() - 0.5) * 10,
        y: player.y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 0.8,
        color: player.buffs.speed > 0 ? BUFF_COLORS.SPEED : (player.buffs.shrink > 0 ? BUFF_COLORS.SHRINK : player.color),
        size: player.radius / 3,
        type: 'TRAIL'
      });
    }

    // --- 2. Buff Logic ---
    // Spawn
    if (Math.random() < GAME_CONSTANTS.BUFF_SPAWN_CHANCE) {
      spawnBuff(width, height);
    }
    // Update & Draw Buffs
    buffsRef.current.forEach((buff, i) => {
      buff.life--;
      // Draw
      const floatY = Math.sin(now * 0.005 + buff.x) * 5;
      ctx.save();
      ctx.translate(buff.x, buff.y + floatY);
      ctx.fillStyle = buff.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = buff.color;
      ctx.beginPath();
      ctx.arc(0, 0, buff.radius, 0, Math.PI * 2);
      ctx.fill();
      // Inner dot
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Collision
      const dist = Math.hypot(player.x - buff.x, player.y - buff.y);
      if (dist < player.radius + buff.radius) {
        // Apply Buff
        soundEngine.playBuffPickup();
        if (buff.type === 'SPEED') player.buffs.speed = 300; // 5s
        if (buff.type === 'SHRINK') player.buffs.shrink = 300; // 5s
        if (buff.type === 'FREEZE') {
            creature.frozenTimer = 180; // 3s
            soundEngine.playFreeze();
        }
        // Remove
        buff.life = 0;
      }
    });
    buffsRef.current = buffsRef.current.filter(b => b.life > 0);


    // --- 3. Hazard Logic ---
    // Spawn rate increases with difficulty
    const currentHazardChance = GAME_CONSTANTS.HAZARD_SPAWN_CHANCE_START + (GAME_CONSTANTS.HAZARD_SPAWN_INCREASE * scoreRef.current);
    if (Math.random() < currentHazardChance) {
        spawnHazard(width, height);
    }
    
    hazardsRef.current.forEach(hazard => {
        hazard.timer--;
        
        ctx.save();
        ctx.translate(hazard.x, hazard.y);
        
        if (hazard.type === 'BOMB') {
            // Warning Phase
            if (hazard.timer > 0) {
                const flash = Math.floor(hazard.timer / 10) % 2 === 0;
                ctx.fillStyle = flash ? '#FFF' : hazard.color;
                ctx.beginPath();
                ctx.arc(0, 0, 15, 0, Math.PI*2);
                ctx.fill();
                // Fuse Text
                ctx.fillStyle = '#FFF';
                ctx.font = '12px monospace';
                ctx.fillText((hazard.timer/60).toFixed(1), -10, -20);
                
                if (hazard.timer % 30 === 0) soundEngine.playFuse();
            } else if (hazard.timer === 0) {
                // Explode
                soundEngine.playExplosion();
                createExplosion(hazard.x, hazard.y, HAZARD_COLORS.BOMB, 20);
                
                // Check player damage
                const dist = Math.hypot(player.x - hazard.x, player.y - hazard.y);
                if (dist < hazard.radius) {
                    onGameOver(scoreRef.current);
                }
            } else {
                // Explosion linger visual (very brief)
                 if (hazard.timer > -10) {
                     ctx.fillStyle = HAZARD_COLORS.BOMB;
                     ctx.globalAlpha = 0.5;
                     ctx.beginPath();
                     ctx.arc(0, 0, hazard.radius, 0, Math.PI*2);
                     ctx.fill();
                     ctx.globalAlpha = 1;
                 }
            }
        } else if (hazard.type === 'SPIKE') {
            // Spikes just sit there
             ctx.fillStyle = hazard.color;
             // Draw spiky shape
             ctx.beginPath();
             for(let i=0; i<5; i++) {
                 const angle = (Math.PI * 2 * i) / 5;
                 const outer = hazard.radius;
                 const inner = hazard.radius / 2;
                 ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
                 ctx.lineTo(Math.cos(angle + Math.PI/5) * inner, Math.sin(angle + Math.PI/5) * inner);
             }
             ctx.closePath();
             ctx.fill();

             // Check collision
             const dist = Math.hypot(player.x - hazard.x, player.y - hazard.y);
             if (dist < player.radius + hazard.radius - 5) { // slightly forgiving hitbox
                  onGameOver(scoreRef.current);
             }
        }
        
        ctx.restore();
    });
    // Remove expired hazards
    hazardsRef.current = hazardsRef.current.filter(h => {
        if (h.type === 'BOMB') return h.timer > -15; // Keep slightly after explode
        if (h.type === 'SPIKE') return h.timer > 0;
        return false;
    });


    // --- 4. Creature Logic ---
    if (creature.frozenTimer > 0) {
        creature.frozenTimer--;
        // Shake visually when frozen
        creature.x += (Math.random()-0.5) * 2;
        creature.y += (Math.random()-0.5) * 2;
        
        // Draw ice block
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(creature.x - creature.radius - 5, creature.y - creature.radius - 5, (creature.radius+5)*2, (creature.radius+5)*2);
        
    } else {
        // Movement
        const angleToPlayer = Math.atan2(player.y - creature.y, player.x - creature.x);
        
        // Difficulty speed up
        const speed = (creature.baseSpeed + (scoreRef.current * GAME_CONSTANTS.CREATURE_SPEED_INCREMENT)) * difficultyFactor.current;
        
        // Wobble
        creature.angle += 0.1;
        const wobbleIntensity = creature.wobbleIntensity * difficultyFactor.current;
        const wobbleOffset = Math.sin(creature.angle) * wobbleIntensity;
        
        const moveX = Math.cos(angleToPlayer) * speed - Math.sin(angleToPlayer) * (wobbleOffset * 0.1);
        const moveY = Math.sin(angleToPlayer) * speed + Math.cos(angleToPlayer) * (wobbleOffset * 0.1);

        creature.x += moveX;
        creature.y += moveY;
        
        // Creature Collision
        const dist = Math.hypot(player.x - creature.x, player.y - creature.y);
        if (dist < player.radius + creature.radius - 5) {
            onGameOver(scoreRef.current);
            return; 
        }
    }

    // Creature Trail
    if (scoreRef.current % 5 === 0 && creature.frozenTimer <= 0) {
       particlesRef.current.push({
        x: creature.x + (Math.random() - 0.5) * 20,
        y: creature.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        life: 1.0,
        color: creature.color,
        size: Math.random() * 8 + 2,
        type: 'TRAIL'
      });
    }

    // --- 5. Particles Logic ---
    particlesRef.current.forEach(p => {
        if (p.type === 'ENV') {
            // Environmental particles float around
            p.x += p.vx;
            p.y += p.vy;
            // Wrap around screen
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // React to creature (Flee)
            const dx = p.x - creature.x;
            const dy = p.y - creature.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 150) {
                const angle = Math.atan2(dy, dx);
                p.x += Math.cos(angle) * 5;
                p.y += Math.sin(angle) * 5;
            }
            
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else {
            // Trail / Explosion
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.size *= 0.95;
            
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life * 0.8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });
    particlesRef.current = particlesRef.current.filter(p => p.type === 'ENV' || p.life > 0);


    // --- 6. Draw Player ---
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = player.color;
    // Buff visual effects
    if (player.buffs.speed > 0) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = BUFF_COLORS.SPEED;
    } else if (player.buffs.shrink > 0) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = BUFF_COLORS.SHRINK;
    } else {
        ctx.shadowBlur = 15;
        ctx.shadowColor = player.color;
    }
    
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const ang = Math.atan2(creature.y - player.y, creature.x - player.x);
    const eyeOffset = player.radius / 3;
    const pupilOffset = 3;
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(-eyeOffset, -2, player.radius/3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeOffset, -2, player.radius/3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(-eyeOffset + Math.cos(ang)*pupilOffset, -2 + Math.sin(ang)*pupilOffset, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeOffset + Math.cos(ang)*pupilOffset, -2 + Math.sin(ang)*pupilOffset, 2, 0, Math.PI*2); ctx.fill();
    
    // Sweat drop if close
    if (Math.hypot(player.x - creature.x, player.y - creature.y) < 200) {
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(player.radius, -player.radius, 4, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();


    // --- 7. Draw Creature ---
    ctx.save();
    ctx.translate(creature.x, creature.y);
    // Pulse
    const pulse = 1 + Math.sin(now * 0.01) * 0.1;
    ctx.scale(pulse, pulse);
    
    ctx.fillStyle = creature.frozenTimer > 0 ? '#88CCFF' : creature.color; // Blue tint if frozen
    ctx.shadowBlur = 20;
    ctx.shadowColor = creature.color;
    
    // Wobbly Shape
    ctx.beginPath();
    for (let i = 0; i <= 360; i += 10) {
      const rad = (i * Math.PI) / 180;
      const r = creature.radius + Math.sin(rad * 5 + now * 0.01) * 5 + Math.cos(rad * 3) * 3;
      const x = Math.cos(rad) * r;
      const y = Math.sin(rad) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Crazy Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(0, -5, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'black';
    // Shaking pupil
    ctx.beginPath(); ctx.arc(Math.random() * 4 - 2, -5 + Math.random() * 4 - 2, 3, 0, Math.PI * 2); ctx.fill();
    
    // Small extra eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-15, 5, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(15, 10, 6, 0, Math.PI*2); ctx.fill();

    // Smile
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 10, 10, 0, Math.PI, false);
    ctx.stroke();

    ctx.restore();


    // --- 8. Taunt System ---
    if (now - lastTauntTime.current > nextTauntInterval.current) {
      const taunt = CREATURE_TAUNTS[Math.floor(Math.random() * CREATURE_TAUNTS.length)];
      setTaunt(taunt);
      soundEngine.playTaunt();
      setTimeout(() => setTaunt(null), 3000);
      lastTauntTime.current = now;
      nextTauntInterval.current = Math.random() * (GAME_CONSTANTS.TAUNT_INTERVAL_MAX - GAME_CONSTANTS.TAUNT_INTERVAL_MIN) + GAME_CONSTANTS.TAUNT_INTERVAL_MIN;
    }

    requestRef.current = requestAnimationFrame(loop);
  }, [gameState, dimensions, onGameOver, setTaunt]);

  // Start Loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="fixed inset-0 cursor-none z-0"
      />
      {/* HUD for score/time */}
      <div className="fixed top-4 left-4 z-10 font-retro text-2xl text-white opacity-50 pointer-events-none">
         SURVIVAL TIME: {(scoreRef.current / 60).toFixed(1)}s
      </div>
    </>
  );
};

export default GameCanvas;