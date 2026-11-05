export type Flow =
  | "none"
  | "spotting"
  | "light"
  | "medium"
  | "heavy";

export interface DailyLog {
  date: string;
  painLevel: number | null;
  moods: Mood[];
  energy: Energy | null;
  flow: Flow | null;
  notes: string | null;
}

export interface PeriodRecord {
  id: string;
  startDate: string;
  endDate: string | null;
}
