'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface AnimatedQuestionModalProps {
  isOpen: boolean;
  onClose: () => void; // Changed from onOpenChange
  context: { habitId: string; eventType: 'HIT' | 'SLIP'; eventId: string; habitName?: string } | null;
  onSave: (eventId: string, answer: string) => Promise<void>;
}

export function AnimatedQuestionModal({ isOpen, onClose, context, onSave }: AnimatedQuestionModalProps) {
  const [answer, setAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [removeTriggered, setRemoveTriggered] = useState(false);

  // Particle type and state for volcano animation
  type Particle = { id: string; char: string; x: number };
  const [particles, setParticles] = useState<Particle[]>([]);

  // Spawn a particle for each new character
  const createParticle = (char: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const x = (Math.random() - 0.5) * 200;
    setParticles(prev => [...prev, { id, char, x }]);
  };

  // Handle textarea changes and emit particles
  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const added = newValue.slice(answer.length);
    added.split('').forEach(c => createParticle(c));
    setAnswer(newValue);
  };

  const handleSave = async () => {
    if (!context || !answer.trim()) return;
    setIsSaving(true);
    let success = false;
    try {
      await onSave(context.eventId, answer);
      toast.success('Reflection saved!');
      success = true;
    } catch (error) {
      console.error("Failed to save reflection:", error);
      toast.error('Failed to save reflection. Please try again.');
    } finally {
      setIsSaving(false);
      if (success) {
        // Trigger particles to fall off screen
        setRemoveTriggered(true);
        // After animation, clear and close
        setTimeout(() => {
          setParticles([]);
          setAnswer('');
          setRemoveTriggered(false);
          onClose();
        }, 1200);
      }
    }
  };

  // Determine question based on event type
  const questionText = context?.eventType === 'HIT'
    ? "What went well that led to this success?"
    : "What challenges did you face? Any insights?";

  // Clear answer and particles when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAnswer('');
      setParticles([]);
      setRemoveTriggered(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && context && (
        <>
          {/* Backdrop */}
          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ x: '100vw', scale: 1 }}
              animate={{ x: '50%', scale: 1 }}
              exit={{ x: '100vw', scale: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="fixed top-1/2 left-1/5 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center space-y-[-24px]"
            >
              {/* Volcano container above modal */}
              <div className="relative w-[90vw] max-w-240 h-32 overflow-visible">
                {particles.map((p, idx) => (
                  <motion.span
                    key={p.id}
                    initial={{ x: 0, y: 0 }}
                    animate={ removeTriggered
                      ? { x: p.x, y: '100vh' }
                      : { x: p.x, y: [0, -200, 0] }
                    }
                    transition={ removeTriggered
                      ? { duration: 1, ease: 'easeIn', delay: idx * 0.1 }
                      : { duration: 1, ease: 'easeInOut', times: [0, 0.5, 1] }
                    }
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 text-lg font-bold text-white z-10"
                  >
                    {p.char}
                  </motion.span>
                ))}
                <div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-20 bg-gradient-to-t from-red-500 to-orange-400 z-0"
                  style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                />
              </div>
              {/* Modal content */}
              <div className="bg-gradient-to-br from-gray-500 to-black p-5 text-white shadow-lg rounded-xl overflow-visible w-[90vw] max-w-240">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Reflection for {context.habitName || 'Habit'}</h2>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                {/* Body */}
                <div className="flex-grow overflow-y-auto pr-2 space-y-4 pt-32">
                  <p className="text-muted-foreground">{questionText}</p>
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="reflection-answer">Your thoughts</Label>
                    <Textarea
                      id="reflection-answer"
                      placeholder="Type your reflection here..."
                      value={answer}
                      onChange={handleAnswerChange}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                </div>
                {/* Footer */}
                <div className="pt-4 mt-auto border-t">
                  <Button
                    className="w-full"
                    onClick={handleSave}
                    disabled={!answer.trim() || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Reflection'}
                  </Button>
                </div>
              </div>
            </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 