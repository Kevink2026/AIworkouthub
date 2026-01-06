import { NextRequest, NextResponse } from 'next/server';
import { generateWorkout } from '@/lib/ai';
import { resolveExercise } from '@/lib/exercisedb';
import { EnrichedWorkout, EnrichedExercise } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput } = body;

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid userInput' },
        { status: 400 }
      );
    }

    if (userInput.length > 1000) {
      return NextResponse.json(
        { error: 'Input too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    // Step 1: Generate workout using AI
    const workout = await generateWorkout(userInput);

    // Step 2: Enrich each exercise with GIF from ExerciseDB
    const enrichedExercises: EnrichedExercise[] = await Promise.all(
      workout.exercises.map(async (exercise) => {
        const resolved = await resolveExercise(
          exercise.name,
          exercise.targetHint
        );

        return {
          ...exercise,
          gifUrl: resolved.gifUrl,
          equipment: resolved.equipment,
          target: resolved.target,
        };
      })
    );

    const enrichedWorkout: EnrichedWorkout = {
      title: workout.title,
      exercises: enrichedExercises,
    };

    return NextResponse.json(enrichedWorkout);
  } catch (error) {
    console.error('Error generating workout:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: 'Failed to generate workout', details: errorMessage },
      { status: 500 }
    );
  }
}
