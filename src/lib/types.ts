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
  events: HabitEvent[]; // Corrected: should be an array of events
  createdAt: string;
  updatedAt: string;
}

export interface HabitEvent {
  id: string;                   
  habitId: string;            
  userId: string;             
  type: "HIT" | "SLIP";       
  timestamp: string;            
  mood?: string;            
  intensity?: number;       
  reflectionNote?: string;  
  emotionTags: string[];    
  aiPromptUsed?: string;   
  isReversal: boolean;        
} 