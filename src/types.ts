export interface JournalEntry {
  id: string;
  prompt: string;
  reply: string;
  createdAt?: any;
  mood?: string;
  tags?: string[];
  pinned?: boolean;
  entryType?: 'written' | 'spoken';
  spokenAudioDuration?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type MoodType = 'Grateful' | 'Reflective' | 'Energized' | 'Seeking Clarity' | 'Peaceful' | 'Anxious' | 'Accomplished';
