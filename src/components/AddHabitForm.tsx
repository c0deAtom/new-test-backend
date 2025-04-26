'use client';

import { useState } from 'react';
import Tag from './Tag';

interface AddHabitFormProps {
  onSubmit: (data: {
    userId: string
    title: string;
    description: string | null;
    positiveCues: string[];
    negativeTriggers: string[];
    motivators: string[];
    successFactors: string[];
  }) => void;
}

export default function AddHabitForm({ onSubmit }: AddHabitFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [positiveCues, setPositiveCues] = useState<string[]>([]);
  const [negativeTriggers, setNegativeTriggers] = useState<string[]>([]);
  const [motivators, setMotivators] = useState<string[]>([]);
  const [successFactors, setSuccessFactors] = useState<string[]>([]);
  const [userId, setUserId] = useState('010b6549-a538-49b0-a2f5-c27082fa3811')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
        userId,
      title,
      description: description || null,
      positiveCues: positiveCues.map(cue => cue.trim()).filter(Boolean),
      negativeTriggers: negativeTriggers.map(trigger => trigger.trim()).filter(Boolean),
      motivators: motivators.map(motivator => motivator.trim()).filter(Boolean),
      successFactors: successFactors.map(factor => factor.trim()).filter(Boolean),

    });

    // Reset form
    setTitle('');
    setDescription('');
    setPositiveCues([]);
    setNegativeTriggers([]);
    setMotivators([]);
    setSuccessFactors([]);
    
  };

 

  return (
   
    

    <div className='bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm w-70 h-100'>
      <div className="space-y-4 max-h-[550px] overflow-y-auto px-4 py-2">
    
    <form onSubmit={handleSubmit} className="bg-gray-200 p-6 rounded-lg shadow-md  max-w-2xl mx-auto">
     
      
      <div className="space-y-4 ">
        <div>
          <label className="block text-sm font-medium text-gray-700">Titlde</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full text-gray-600 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            placeholder="e.g. Daily Meditation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            placeholder="e.g. 15 minutes of mindfulness meditation"
          />
        </div>
       <p>positiveCues</p>
        <Tag data={positiveCues} title="Positive Cues"
      setData={setPositiveCues}/>
 <p>negativeTriggers</p>
       <Tag data={negativeTriggers}
       setData={setNegativeTriggers} title="Negetive Triggers"/>

<p>motivator</p>
      <Tag data={motivators}
      setData={setMotivators}
      title="Motivators"
      />

<p>successFactors</p>
      <Tag data={successFactors}
      title="Success Factors"
      setData={setSuccessFactors}/>
        <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Habit
          </button>

      
 

        <div className="pt-4">
        
        </div>
      </div>
    </form>
    </div>
    </div>
  
  );
} 