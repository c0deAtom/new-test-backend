export interface HabitEvent {
  id: string;
  eventType: string;
  eventDate: string;
  habitId: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  goalType: string;
  microGoal: string;
  triggers: string[];
  cravingNarrative: string;
  resistanceStyle: string;
  motivationOverride: string;
  reflectionDepthOverride: number;
  hitDefinition: string;
  slipDefinition: string;
  event: HabitEvent;
  events: HabitEvent[];
  createdAt: string;
  updatedAt: string;
} 