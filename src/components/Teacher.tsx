'use client';
import { Card } from '@/components/ui/card';
import  AIChatBox  from '@/app/mobile/AIChatBox';

interface TeacherProps {
  setRefetchTrigger: React.Dispatch<React.SetStateAction<number>>;
}

export default function Teacher({ setRefetchTrigger }: TeacherProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8">
     
      <div className="w-full flex justify-center mt-20">
        <AIChatBox setRefetchTrigger={setRefetchTrigger} />
      </div>
    </div>
  );
} 