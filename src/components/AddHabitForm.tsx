'use client';

import { useState } from 'react';
import Tag from './Tag';
import { Button } from './ui/button';

export default function AddHabitForm({ onSubmit, onRefresh }: { 
  onSubmit: () => void; 
  onRefresh: () => void;
}) {
  const [name, setName] = useState('');
  const [userId] = useState('010b6549-a538-49b0-a2f5-c27082fa3811');
  const [goalType, setGoalType] = useState('');
  const [microGoal, setMicroGoal] = useState('');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [cravingNarrative, setCravingNarrative] = useState('');
  const [resistanceStyle, setResistanceStyle] = useState('');
  const [motivationOverride, setMotivationOverride] = useState('');
  const [reflectionDepthOverride, setReflectionDepthOverride] = useState<number>(3);
  const [hitDefinition, setHitDefinition] = useState('');
  const [slipDefinition, setSlipDefinition] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setReflectionDepthOverride(3);
      setHitDefinition('');
      setSlipDefinition('');
      onRefresh();
      onSubmit();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4 w-full overflow-y-auto">
      {/* Add Habit Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gradient-to-br from-green-200 to-pink-300 p-8 rounded-2xl shadow-xl max-w-4xl  grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700">Habit Title</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 text-gray-800 shadow focus:border-blue-500 focus:ring-blue-500 pl-3"
            required
            placeholder="e.g. Daily Meditation"
          />
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700">Goal Type</label>
          <select
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 text-gray-800 shadow focus:border-blue-500 focus:ring-blue-500 pl-3"
            required
          >
            <option value="" disabled>Select goal type</option>
            <option value="reduce">Reduce</option>
            <option value="eliminate">Eliminate</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700">Micro Goal</label>
          <input
            type="text"
            value={microGoal}
            onChange={(e) => setMicroGoal(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 text-gray-800 shadow focus:border-blue-500 focus:ring-blue-500 pl-3"
            placeholder="e.g. meditate 5 minutes"
          />
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-medium text-gray-700">Triggers</p>
          <Tag data={triggers} setData={setTriggers} title="Triggers" />
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700">Craving Narrative</label>
          <textarea
            value={cravingNarrative}
            onChange={(e) => setCravingNarrative(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 text-gray-900 shadow focus:border-purple-500 focus:ring-purple-500 pl-3"
            rows={2}
            placeholder="What story do you tell yourself when craving?"
          />
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700">Resistance Style</label>
          <input
            type="text"
            value={resistanceStyle}
            onChange={(e) => setResistanceStyle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 text-gray-800 shadow focus:border-green-500 focus:ring-green-500 pl-3"
            placeholder="e.g. ignore, distract"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Reflection Depth Override: {reflectionDepthOverride}
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={reflectionDepthOverride}
            onChange={(e) => setReflectionDepthOverride(parseInt(e.target.value))}
            className="w-full mt-2 accent-gray-500"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Hit Definition</label>
          <input
            type="text"
            value={hitDefinition}
            onChange={(e) => setHitDefinition(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 text-gray-800 shadow focus:border-blue-500 focus:ring-blue-500 pl-3"
            placeholder="What counts as a hit?"
          />
        </div>

        <div className="flex flex-col md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Slip Definition</label>
          <input
            type="text"
            value={slipDefinition}
            onChange={(e) => setSlipDefinition(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-700 text-gray-800 shadow focus:border-red-500 focus:ring-red-500 pl-3"
            placeholder="What counts as a slip?"
          />
        </div>

        <div className="md:col-span-2 text-center mt-4">
          <Button
            type="submit"
            variant="default"
            className="px-8 py-4 bg-gradient-to-r from-gray-200 to-gray-500 text-white rounded-lg shadow-md hover:from-gray-500 hover:to-gray-200 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-offset-2"
          >
            <span className="font-semibold text-lg">Create Habit</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
