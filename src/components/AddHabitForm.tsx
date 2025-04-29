'use client';

import { useState } from 'react';
import Tag from './Tag';

export default function AddHabitForm({ onSubmit, onRefresh, }: { 
  onSubmit: () => void, 
  onRefresh: () => void,

})  {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('010b6549-a538-49b0-a2f5-c27082fa3811'); // Replace this dynamically later if needed
  const [goalType, setGoalType] = useState(''); // reduce | eliminate
  const [microGoal, setMicroGoal] = useState('');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [cravingNarrative, setCravingNarrative] = useState('');
  const [resistanceStyle, setResistanceStyle] = useState('');
  const [motivationOverride, setMotivationOverride] = useState('');
  const [reflectionDepthOverride, setReflectionDepthOverride] = useState<number | undefined>();
  const [hitDefinition, setHitDefinition] = useState('');
  const [slipDefinition, setSlipDefinition] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name,
          goalType,
          microGoal,
          triggers,
          cravingNarrative,
          resistanceStyle,
          motivationOverride,
          reflectionDepthOverride,
          hitDefinition,
          slipDefinition,
        }),
      });

      if (!res.ok) throw new Error('Failed to create habit');

      const newHabit = await res.json();
      console.log('Habit Created:', newHabit);

      // Reset form
      setName('');
      setGoalType('');
      setMicroGoal('');
      setTriggers([]);
      setCravingNarrative('');
      setResistanceStyle('');
      setMotivationOverride('');
      setReflectionDepthOverride(undefined);
      setHitDefinition('');
      setSlipDefinition('');
    } catch (error) {
      console.error(error);
    }
    onRefresh()
    onSubmit()
  };
  

  return (
    <div className="space-y-4 max-h-[550px] overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Habit Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full text-gray-600 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              placeholder="e.g. Daily Meditation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Goal Type (reduce / eliminate)</label>
            <input
              type="text"
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="mt-1 block w-full text-gray-600 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g. reduce"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Micro Goal</label>
            <input
              type="text"
              value={microGoal}
              onChange={(e) => setMicroGoal(e.target.value)}
              className="mt-1 block w-full text-gray-600 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g. meditate 5 minutes"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Triggers</p>
            <Tag data={triggers} setData={setTriggers} title="Triggers" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Craving Narrative</label>
            <textarea
              value={cravingNarrative}
              onChange={(e) => setCravingNarrative(e.target.value)}
              className="mt-1 block w-full text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={2}
              placeholder="What story you tell yourself when craving?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Resistance Style</label>
            <input
              type="text"
              value={resistanceStyle}
              onChange={(e) => setResistanceStyle(e.target.value)}
              className="mt-1 block w-full text-gray-600 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g. ignore, distract"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Motivation Override</label>
            <input
              type="text"
              value={motivationOverride}
              onChange={(e) => setMotivationOverride(e.target.value)}
              className="mt-1 block w-full text-gray-600 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="What you remind yourself?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reflection Depth Override (1-5)</label>
            <input
              type="number"
              value={reflectionDepthOverride ?? ''}
              onChange={(e) => setReflectionDepthOverride(e.target.value ? parseInt(e.target.value) : undefined)}
              className="mt-1 block w-full text-gray-600 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="1-5"
              min="1"
              max="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Hit Definition</label>
            <input
              type="text"
              value={hitDefinition}
              onChange={(e) => setHitDefinition(e.target.value)}
              className="mt-1 block w-full text-gray-600 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="What counts as a hit?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Slip Definition</label>
            <input
              type="text"
              value={slipDefinition}
              onChange={(e) => setSlipDefinition(e.target.value)}
              className="mt-1 block w-full text-gray-600 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="What counts as a slip?"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Habit
          </button>
          
        </div>
      </form>
    </div>
  );
}
