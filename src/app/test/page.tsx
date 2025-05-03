'use client'

import { useState } from "react";
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Each particle represents a single character flying from the volcano
type Particle = { id: string; char: string; x: number };

export default function TestPage() {
  const [inputValue, setInputValue] = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showVolcano, setShowVolcano] = useState(true);
  const [removeTriggered, setRemoveTriggered] = useState(false);

  // Spawn a new particle for the given character
  const createParticle = (char: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const x = (Math.random() - 0.5) * 200; // horizontal spread
    setParticles((prev) => [...prev, { id, char, x }]);
  };

  // On input change, emit particles when volcano is visible
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const added = newValue.slice(inputValue.length);
    if (showVolcano) added.split('').forEach(createParticle);
    setInputValue(newValue);
  };

  return (
    <div className="p-8 flex flex-col items-center space-y-8">
      <Button
        variant="destructive"
        onClick={() => { setRemoveTriggered(true); setShowVolcano(false); }}
        disabled={!showVolcano}
      >
        Remove Volcano
      </Button>
      {/* Input to type text */}
      <Input
        placeholder="Type something..."
        value={inputValue}
        onChange={handleChange}
        className="w-64"
        disabled={!showVolcano}
      />

      {/* Volcano container */}
      <div className="relative w-48 h-32 overflow-visible">
        {/* Animated character particles */}
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ x: 0, y: 0 }}
            animate={
              removeTriggered
                ? { x: p.x, y: '100vh' }
                : { x: p.x, y: -128 }
            }
            transition={
              removeTriggered
                ? { duration: 1.5, ease: 'easeIn' }
                : { duration: 1, ease: 'easeOut' }
            }
            onAnimationComplete={() => {
              if (removeTriggered) setParticles([]);
            }}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-lg font-bold z-10"
          >
            {p.char}
          </motion.span>
        ))}

        {showVolcano && (
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-20 bg-gradient-to-t from-red-500 to-orange-400 z-0"
            style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
          />
        )}
      </div>
    </div>
  );
}
