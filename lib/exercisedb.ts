import { ExerciseDBResult } from './types';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'exercisedb.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

async function fetchFromExerciseDB(endpoint: string): Promise<ExerciseDBResult[]> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    console.error(`ExerciseDB API error: ${response.status} ${response.statusText}`);
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Search for an exercise by name
 */
export async function searchByName(name: string): Promise<ExerciseDBResult | null> {
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
export async function searchByTarget(target: string): Promise<ExerciseDBResult | null> {
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
    'serratus anterior': 'serratus anterior',
    'levator scapulae': 'levator scapulae',
    'cardiovascular system': 'cardiovascular system',
  };

  const normalized = target.toLowerCase().trim();
  return targetMap[normalized] || normalized;
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

  return {
    gifUrl: exercise.gifUrl,
    name: exercise.name,
    equipment: exercise.equipment,
    target: exercise.target,
  };
}
