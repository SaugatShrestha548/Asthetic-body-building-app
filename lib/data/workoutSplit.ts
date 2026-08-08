import { DaySplit } from "@/lib/types";

export const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

// Keyed by JS Date.getDay(): 0 = Sunday ... 6 = Saturday
export const SPLIT: Record<number, DaySplit> = {
  0: {
    title: "Shoulders + Arms + Abs",
    rest: false,
    exercises: [
      { id: "s-pike", name: "Pike Push-ups", sets: 4, reps: "8-12" },
      { id: "s-lat", name: "Lateral Raises", sets: 3, reps: "12-15" },
      { id: "s-curl2", name: "Backpack Curl", sets: 3, reps: "10-12" },
      { id: "s-otricep", name: "Backpack Overhead Tricep Extension", sets: 3, reps: "10-12" },
      { id: "s-hknee", name: "Hanging Knee Raise", sets: 3, reps: "12-15" },
      { id: "s-splank", name: "Side Plank", sets: 3, reps: "30-45s" },
    ],
  },
  1: {
    title: "Chest + Biceps",
    rest: false,
    exercises: [
      { id: "m-feet", name: "Feet Elevated Push-ups", sets: 4, reps: "10-15" },
      { id: "m-bpush", name: "Backpack Push-ups", sets: 3, reps: "8-12" },
      { id: "m-diamond", name: "Diamond Push-ups", sets: 3, reps: "8-12" },
      { id: "m-chin", name: "Chin-ups", sets: 4, reps: "6-10" },
      { id: "m-curl", name: "Backpack Bicep Curl", sets: 3, reps: "10-12" },
    ],
  },
  2: {
    title: "Back + Legs",
    rest: false,
    exercises: [
      { id: "t-pullup", name: "Pull-ups", sets: 4, reps: "6-10" },
      { id: "t-rows", name: "Backpack Rows", sets: 4, reps: "10-12" },
      { id: "t-bulgarian", name: "Bulgarian Split Squats", sets: 3, reps: "10-12 /leg" },
      { id: "t-bsquat", name: "Backpack Squats", sets: 4, reps: "12-15" },
      { id: "t-calf", name: "Standing Calf Raises", sets: 3, reps: "15-20" },
    ],
  },
  3: {
    title: "Shoulders + Abs",
    rest: false,
    exercises: [
      { id: "w-pike", name: "Pike Push-ups", sets: 4, reps: "8-12" },
      { id: "w-ohp", name: "Backpack Overhead Press", sets: 3, reps: "10-12" },
      { id: "w-lat", name: "Backpack Lateral Raise", sets: 3, reps: "12-15" },
      { id: "w-plank", name: "Plank", sets: 3, reps: "45-60s" },
      { id: "w-hleg", name: "Hanging Leg Raise", sets: 3, reps: "10-15" },
      { id: "w-rtwist", name: "Russian Twist", sets: 3, reps: "20-30" },
    ],
  },
  4: {
    title: "Chest + Triceps",
    rest: false,
    exercises: [
      { id: "th-wide", name: "Wide Push-ups", sets: 4, reps: "10-15" },
      { id: "th-dips", name: "Chair Dips", sets: 3, reps: "10-15" },
      { id: "th-incline", name: "Incline Push-ups", sets: 3, reps: "10-15" },
      { id: "th-diamond", name: "Diamond Push-ups", sets: 3, reps: "8-12" },
      { id: "th-tricep", name: "Backpack Tricep Extension", sets: 3, reps: "10-12" },
    ],
  },
  5: {
    title: "Back + Legs",
    rest: false,
    exercises: [
      { id: "f-wpullup", name: "Wide Pull-ups", sets: 4, reps: "6-10" },
      { id: "f-chin", name: "Chin-ups", sets: 3, reps: "6-10" },
      { id: "f-rdl", name: "Backpack Romanian Deadlift", sets: 4, reps: "10-12" },
      { id: "f-lunge", name: "Walking Lunges", sets: 3, reps: "12 /leg" },
      { id: "f-calf", name: "Calf Raises", sets: 3, reps: "15-20" },
    ],
  },
  6: { title: "Rest Day", rest: true, exercises: [] },
};
