"use client";

import { useEffect, useState } from "react";


interface HabitData {
   data: string[];
   title: string;
   setData: React.Dispatch<React.SetStateAction<string[]>>;
  
}
export default function Tag({data, setData, title}: HabitData) {
  const [tags, setTags] = useState<string[]>(data);
  const [inputValue, setInputValue] = useState("");
 

useEffect(() => {
    setData(tags);
    
}, [tags])


   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        setTags([...tags, inputValue.trim()]);
      }
      setInputValue("");
    }

    if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      const newTags = [...tags];
      newTags.pop();
      setTags(newTags);
    }
  };

  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.slice(index, 1);
    setTags(newTags);
  };

  

  return (
    <div className="border w-47 ">
   <div className="w-full max-w-xl mx-auto">
  <div className="flex flex-wrap gap-2">
    {tags.map((tag, index) => (
      <div
        key={index}
        className="flex items-center justify-between bg-gray-300 text-gray-800 px-2 py-1 rounded-full text-sm font-medium"
      >
        <span>{tag}</span>
        <button
          onClick={() => removeTag(index)}
          className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
        >
          &times;
        </button>
      </div>
    ))}
  </div>
</div>
 <div>
        <input
          type="text"
          className="flex-grow outline-none px-2 py-1 text-gray-500 text-sm  w-fulln m"
          placeholder="Type and press Enter..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        </div>
     
    </div>
  );
}
