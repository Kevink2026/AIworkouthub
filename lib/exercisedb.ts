import { ExerciseDBResult } from './types';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'exercisedb.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

interface ExerciseResponse {
  id: string;
  name: string;
  target: string;
  equipment: string;
  bodyPart: string;
  secondaryMuscles: string[];
  instructions: string[];
}

async function fetchFromExerciseDB(endpoint: string): Promise<ExerciseResponse[]> {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`[ExerciseDB] Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    console.log(`[ExerciseDB] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ExerciseDB] API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`[ExerciseDB] Fetch error:`, error);
    return [];
  }
}

/**
 * Get exercise by ID - this endpoint might return gifUrl
 */
async function getExerciseById(id: string): Promise<ExerciseResponse | null> {
  const url = `${BASE_URL}/exercises/exercise/${id}`;
  console.log(`[ExerciseDB] Getting exercise by ID: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

/**
 * Search for an exercise by name
 */
export async function searchByName(name: string): Promise<ExerciseResponse | null> {
  const encodedName = encodeURIComponent(name.toLowerCase());
  const results = await fetchFromExerciseDB(`/exercises/name/${encodedName}?limit=10`);

  if (results.length === 0) {
    return null;
  }

  // Try exact match first
  const exactMatch = results.find(
    (ex) => ex.name.toLowerCase() === name.toLowerCase()
  );
  if (exactMatch) {
    return exactMatch;
  }

  // Return first result as best match
  return results[0];
}

/**
 * Search for exercises by target muscle
 */
export async function searchByTarget(target: string): Promise<ExerciseResponse | null> {
  const normalizedTarget = normalizeTarget(target);
  const results = await fetchFromExerciseDB(`/exercises/target/${normalizedTarget}?limit=5`);

  if (results.length === 0) {
    return null;
  }

  return results[0];
}

/**
 * Normalize target muscle names to ExerciseDB format
 */
function normalizeTarget(target: string): string {
  const targetMap: Record<string, string> = {
    'chest': 'pectorals',
    'pecs': 'pectorals',
    'pectorals': 'pectorals',
    'back': 'lats',
    'lats': 'lats',
    'latissimus': 'lats',
    'shoulders': 'delts',
    'delts': 'delts',
    'deltoids': 'delts',
    'biceps': 'biceps',
    'triceps': 'triceps',
    'quads': 'quads',
    'quadriceps': 'quads',
    'hamstrings': 'hamstrings',
    'glutes': 'glutes',
    'calves': 'calves',
    'abs': 'abs',
    'core': 'abs',
    'abdominals': 'abs',
    'forearms': 'forearms',
    'traps': 'traps',
    'trapezius': 'traps',
    'adductors': 'adductors',
    'abductors': 'abductors',
    'upper back': 'upper back',
    'spine': 'spine',
  };

  const normalized = target.toLowerCase().trim();
  return targetMap[normalized] || normalized;
}

/**
 * Fetch single exercise by ID to get full details including gifUrl
 */
async function fetchExerciseById(id: string): Promise<any> {
  const url = `${BASE_URL}/exercises/exercise/${id}`;
  console.log(`[ExerciseDB] Fetching single exercise: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      console.error(`[ExerciseDB] Single fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`[ExerciseDB] Single exercise response keys:`, Object.keys(data));
    if (data.gifUrl) {
      console.log(`[ExerciseDB] Found gifUrl: ${data.gifUrl}`);
    }
    return data;
  } catch (error) {
    console.error(`[ExerciseDB] Single fetch error:`, error);
    return null;
  }
}

/**
 * Resolve an exercise - first try by name, then fallback to target
 */
export async function resolveExercise(
  name: string,
  targetHint: string
): Promise<{ gifUrl: string | null; name: string; equipment: string | null; target: string | null }> {
  // First try by name
  let exercise = await searchByName(name);

  // If not found, try by target
  if (!exercise && targetHint) {
    exercise = await searchByTarget(targetHint);
  }

  if (!exercise) {
    return {
      gifUrl: null,
      name: name,
      equipment: null,
      target: null,
    };
  }

  // Try to get full exercise details (might include gifUrl)
  const fullExercise = await fetchExerciseById(exercise.id);

  let gifUrl: string | null = null;

  if (fullExercise?.gifUrl) {
    gifUrl = fullExercise.gifUrl;
  } else {
    // Fallback: try known URL patterns
    gifUrl = `https://v2.exercisedb.io/image/${exercise.id}`;
  }

  console.log(`[ExerciseDB] Final - Exercise: ${exercise.name}, ID: ${exercise.id}, GIF: ${gifUrl}`);

  return {
    gifUrl,
    name: exercise.name,
    equipment: exercise.equipment,
    target: exercise.target,
  };
}
