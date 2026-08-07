export interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ExerciseLogEntry {
  sets: WorkoutSet[];
  difficulty: number; // 1-10
  notes: string;
}

export type WorkoutLog = Record<string, ExerciseLogEntry>; // exerciseId -> entry

export interface WeightEntry {
  id: string;
  date: string;
  kg: number;
}

export interface MeasurementEntry {
  id: string;
  date: string;
  chest?: number;
  shoulders?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  forearms?: number;
  thighs?: number;
  calves?: number;
  neck?: number;
  bodyFat?: number;
  [key: string]: string | number | undefined;
}

export interface MealEntry {
  id: string;
  foodId?: string;
  name: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving?: string;
}

export interface PhotoEntry {
  id: string;
  date: string;
  note: string;
}

export interface CheckinEntry {
  energy: number;
  sleepQuality: number;
  hoursSlept: number;
  soreness: number;
  motivation: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Settings {
  theme: "dark" | "light";
  proteinGoal: number;
  calorieGoal: number;
  waterGoal: number;
  units: "metric" | "imperial";
}

export interface AppState {
  settings: Settings;
  weightLog: WeightEntry[];
  measurements: MeasurementEntry[];
  meals: Record<string, MealEntry[]>;
  water: Record<string, number>;
  workoutLogs: Record<string, WorkoutLog>;
  habits: Record<string, Record<string, boolean>>;
  photos: PhotoEntry[];
  checkins: Record<string, CheckinEntry>;
  chatHistory: ChatMessage[];
  xp: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
}

export interface DaySplit {
  title: string;
  rest: boolean;
  exercises: Exercise[];
}

export interface Food {
  id: string;
  name: string;
  serving: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface ExerciseMeta {
  name: string;
  group: "chest" | "back" | "legs" | "shoulders" | "arms" | "abs";
  primary: string[];
  secondary: string[];
  difficulty: string;
  equipment: string;
  tempo: string;
  breathing: string;
  rom: string;
  form: string[];
  mistakes: string[];
  safety: string[];
  progressions: string[];
  regressions: string[];
  variations: string[];
}

export interface ProgressionTip {
  type: "plateau" | "progress" | "deload" | "on-track";
  text: string;
}
