import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState } from './types';
import { soundEngine } from './services/SoundEngine';
import { Skull, Volume2, VolumeX, Ghost } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [finalScore, setFinalScore] = useState(0);
  const [taunt, setTaunt] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  // Toggle Mute
  const toggleMute = () => {
    const newMute = !muted;
    setMuted(newMute);
    soundEngine.setMute(newMute);
  };

  // Start Game
  const startGame = () => {
    soundEngine.playStart();
    setGameState('PLAYING');
    setTaunt(null);
  };

  // Game Over Handler
  const handleGameOver = (frames: number) => {
    setFinalScore(frames);
    setGameState('GAME_OVER');
    soundEngine.playGameOver();
  };

  // Format score frames to seconds
  const scoreSeconds = (finalScore / 60).toFixed(2);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-900 scanlines select-none text-white">
      
      {/* Audio Control */}
      <button 
        onClick={toggleMute}
        className="fixed top-4 right-4 z-50 p-2 bg-black/50 rounded-full hover:bg-white/10 transition-colors"
      >
        {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      {/* Main Game Canvas */}
      <GameCanvas 
        gameState={gameState} 
        onGameOver={handleGameOver}
        setTaunt={setTaunt} 
      />

      {/* Taunt Popups */}
      {taunt && gameState === 'PLAYING' && (
        <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none w-full text-center px-4">
          <h2 className="text-3xl md:text-5xl font-creepy text-red-500 animate-shake drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
            "{taunt}"
          </h2>
        </div>
      )}

      {/* Start Screen */}
      {gameState === 'START' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-flicker">
          <div className="text-center space-y-6 max-w-md px-6">
            <h1 className="text-6xl md:text-8xl font-creepy text-red-600 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">
              THE WOBBLY WATCHER
            </h1>
            <p className="text-xl font-retro text-gray-300">
              You are small. It is wobbly.<br/>It wants a hug. Do NOT let it hug you.
            </p>
            
            <div className="py-4 flex justify-center">
              <Ghost className="w-16 h-16 text-purple-400 animate-bounce" />
            </div>

            <button 
              onClick={startGame}
              className="px-8 py-4 bg-red-700 hover:bg-red-600 text-white font-bold text-2xl font-retro rounded shadow-[0_0_20px_rgba(255,0,0,0.4)] hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:scale-105 transition-all active:scale-95"
            >
              START ESCAPE
            </button>
            <p className="text-xs text-gray-500 font-mono mt-4">
              Use MOUSE or TOUCH to run.
            </p>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-red-900/90 backdrop-blur-md">
          <div className="text-center space-y-4 animate-shake">
            <Skull className="w-24 h-24 mx-auto text-black mb-4" />
            <h2 className="text-6xl font-creepy text-black drop-shadow-lg">
              SQUISHED!
            </h2>
            <p className="text-2xl font-retro text-white">
              You survived for <span className="text-yellow-300 text-4xl">{scoreSeconds}</span> seconds.
            </p>
            
            <div className="mt-8">
              <p className="text-lg font-creepy text-red-200 italic mb-6">
                "You taste like blueberries and fear."
              </p>
              
              <button 
                onClick={startGame}
                className="px-8 py-3 bg-black border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold text-xl font-retro rounded transition-all uppercase"
              >
                Try Again?
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}