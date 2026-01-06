export interface Exercise {
  name: string;
  targetHint: string;
  sets: number;
  reps: string;
  restSec: number;
  note: string;
}

export interface Workout {
  title: string;
  exercises: Exercise[];
}

export interface ExerciseDBResult {
  id: string;
  name: string;
  target: string;
  equipment: string;
  bodyPart: string;
  gifUrl: string;
  secondaryMuscles: string[];
  instructions: string[];
}

export interface EnrichedExercise extends Exercise {
  gifUrl: string | null;
  equipment: string | null;
  target: string | null;
}

export interface EnrichedWorkout {
  title: string;
  exercises: EnrichedExercise[];
}
