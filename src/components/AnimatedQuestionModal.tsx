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

  const handleSave = async () => {
    if (!context || !answer.trim()) return;
    setIsSaving(true);
    try {
      await onSave(context.eventId, answer);
      toast.success('Reflection saved!');
      setAnswer(''); // Clear answer
      onClose(); // Close modal
    } catch (error) {
      console.error("Failed to save reflection:", error);
      toast.error('Failed to save reflection. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Determine question based on event type
  const questionText = context?.eventType === 'HIT'
    ? "What went well that led to this success?"
    : "What challenges did you face? Any insights?";

  // Clear answer when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAnswer('');
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
              className="fixed top-1/2 left-1/5 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-240 bg-gradient-to-br from-gray-500 to-black p-5 text-white shadow-lg z-50 rounded-xl overflow-hidden"
            >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Reflection for {context.habitName || 'Habit'}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
              <p className="text-muted-foreground">{questionText}</p>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="reflection-answer">Your thoughts</Label>
                <Textarea
                  id="reflection-answer"
                  placeholder="Type your reflection here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={6} // Adjusted rows
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 