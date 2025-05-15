import { MobileStickyNoteCard } from '@/components/MobileStickyNoteCard';
import React from 'react';

interface FullScreenNoteCardProps {
  note: any;
  tags: string[];
  onClose: () => void;
  onChange: (value: string) => void;
  onDelete: () => void;
  onBlur: () => void;
  onTagSelection: (tagIndex: number, isSelected: boolean) => void;
  selectAllTags: () => void;
  deselectAllTags: () => void;
  selectedTags: number[];
  isPlayingAll: boolean;
  onStopPlaying: () => void;
  currentPlayingTag: { noteId: string; tagIndex: number } | null;
  onTagFinished: () => void;
  isPaused: boolean;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;
  onTagAdd: (newTag: string) => void;
  onTagDelete: (deletedTagIndexes: number[]) => void;
  onTagEdit: (tagIndex: number, newValue: string) => void;
  view: 'icon' | 'list' | 'big';
  isProcessing?: any;
}

export function FullScreenNoteCard(props: FullScreenNoteCardProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center w-full h-auto mt-14 p-0">
      <div className="w-full max-w-3xl flex flex-col items-center justify-center p-5">
        <MobileStickyNoteCard
          note={props.note}
          index={0}
          tags={props.tags}
          onChange={props.onChange}
          onDelete={props.onDelete}
          onBlur={props.onBlur}
          onTagSelection={props.onTagSelection}
          selectAllTags={props.selectAllTags}
          deselectAllTags={props.deselectAllTags}
          selectedTags={props.selectedTags}
          isPlayingAll={props.isPlayingAll}
          onStopPlaying={props.onStopPlaying}
          currentPlayingTag={props.currentPlayingTag}
          onTagFinished={props.onTagFinished}
          isPaused={props.isPaused}
          setCurrentAudio={props.setCurrentAudio}
          onTagAdd={props.onTagAdd}
          onTagDelete={props.onTagDelete}
          onTagEdit={props.onTagEdit}
          view={props.view}
          isProcessing={props.isProcessing}
          onClose={props.onClose}
        />
      </div>
    </div>
  );
} 