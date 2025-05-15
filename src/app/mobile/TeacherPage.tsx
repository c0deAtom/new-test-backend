'use client';

import Teacher from '@/components/Teacher';

interface TeacherPageProps {
  setRefetchTrigger: React.Dispatch<React.SetStateAction<number>>;
}

export default function TeacherPage({ setRefetchTrigger }: TeacherPageProps) {
  return <Teacher setRefetchTrigger={setRefetchTrigger} />;
} 