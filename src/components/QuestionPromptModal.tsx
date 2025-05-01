'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

interface QuestionPromptModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  context: { habitId: string; eventType: 'HIT' | 'SLIP', habitName?: string } | null;
  onSubmit: (habitId: string, eventType: 'HIT' | 'SLIP', answer: string) => Promise<void>;
}

export function QuestionPromptModal({ isOpen, onOpenChange, context, onSubmit }: QuestionPromptModalProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!context || !answer.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(context.habitId, context.eventType, answer);
      toast.success('Response submitted!');
      setAnswer(''); // Clear answer
      onOpenChange(false); // Close modal
    } catch (error) {
      console.error("Failed to submit answer:", error);
      toast.error('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine question based on event type
  const questionText = context?.eventType === 'HIT'
    ? "What went well that led to this success?"
    : "What challenges did you face? Any insights?";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) setAnswer(''); // Clear answer if closing
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reflection for {context?.habitName || 'Habit'}</DialogTitle>
          <DialogDescription>
            {questionText}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="answer">Your thoughts</Label>
            <Textarea
              id="answer"
              placeholder="Type your reflection here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={!answer.trim() || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Response'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 