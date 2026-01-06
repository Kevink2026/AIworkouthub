// ExerciseDB v2 API wrapper
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'exercisedb-api1.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

// v2 API response structure
interface ExerciseV2 {
  exerciseId: string;
  name: string;
  imageUrl: string;
  videoUrl: string;
  equipments: string[];
  bodyParts: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  overview: string;
}

/**
 * Search exercises by name using v2 API
 * Endpoint: /api/v1/exercises?name=...
 */
async function searchExercises(query: string): Promise<ExerciseV2[]> {
  // Use /api/v1/exercises with name parameter
  const url = `${BASE_URL}/api/v1/exercises?name=${encodeURIComponent(query)}&limit=10`;
  console.log(`[ExerciseDB v2] Searching: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    console.log(`[ExerciseDB v2] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ExerciseDB v2] API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    console.log(`[ExerciseDB v2] Response:`, JSON.stringify(data, null, 2).substring(0, 1000));

    // Handle v2 response structure: { success: true, data: [...exercises...] }
    if (data.success && Array.isArray(data.data)) {
      console.log(`[ExerciseDB v2] Found ${data.data.length} exercises`);
      return data.data;
    }
    if (data.data?.exercises) {
      return data.data.exercises;
    }
    if (Array.isArray(data)) {
      return data;
    }
    if (data.exercises) {
      return data.exercises;
    }

    return [];
  } catch (error) {
    console.error(`[ExerciseDB v2] Fetch error:`, error);
    return [];
  }
}

/**
 * Get all exercises (for browsing)
 */
async function getAllExercises(limit: number = 10): Promise<ExerciseV2[]> {
  const url = `${BASE_URL}/api/v1/exercises?limit=${limit}`;
  console.log(`[ExerciseDB v2] Getting all exercises: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    console.log(`[ExerciseDB v2] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ExerciseDB v2] API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    console.log(`[ExerciseDB v2] Full response:`, JSON.stringify(data, null, 2).substring(0, 1000));

    // Handle v2 response structure: { success: true, data: [...exercises...] }
    if (data.success && Array.isArray(data.data)) {
      console.log(`[ExerciseDB v2] Found ${data.data.length} exercises`);
      return data.data;
    }
    if (data.data?.exercises) {
      return data.data.exercises;
    }
    if (Array.isArray(data)) {
      return data;
    }

    return [];
  } catch (error) {
    console.error(`[ExerciseDB v2] Fetch error:`, error);
    return [];
  }
}

/**
 * Resolve an exercise - search by name and get image URL
 */
export async function resolveExercise(
  name: string,
  targetHint: string
): Promise<{ gifUrl: string | null; name: string; equipment: string | null; target: string | null }> {
  // Search for the exercise
  let exercises = await searchExercises(name);

  // If no results, try with target hint
  if (exercises.length === 0 && targetHint) {
    console.log(`[ExerciseDB v2] No results for "${name}", trying target: ${targetHint}`);
    exercises = await searchExercises(targetHint);
  }

  // If still no results, try getting any exercises
  if (exercises.length === 0) {
    console.log(`[ExerciseDB v2] No search results, getting default exercises`);
    exercises = await getAllExercises(5);
  }

  if (exercises.length === 0) {
    console.log(`[ExerciseDB v2] No exercises found at all`);
    return {
      gifUrl: null,
      name: name,
      equipment: null,
      target: null,
    };
  }

  // Find best match
  const exercise = exercises[0];

  // Build image URL - v2 API returns imageUrl field
  let imageUrl: string | null = null;

  if (exercise.imageUrl) {
    // If it's a full URL, use it directly
    if (exercise.imageUrl.startsWith('http')) {
      imageUrl = exercise.imageUrl;
    } else {
      // Construct CDN URL
      imageUrl = `https://media.exercisedb.dev/image/${exercise.imageUrl}`;
    }
  }

  console.log(`[ExerciseDB v2] Found exercise: ${exercise.name}, imageUrl: ${imageUrl}`);

  return {
    gifUrl: imageUrl,
    name: exercise.name || name,
    equipment: exercise.equipments?.[0] || null,
    target: exercise.targetMuscles?.[0] || exercise.bodyParts?.[0] || null,
  };
}

// Backward compatibility exports
export async function searchByName(name: string): Promise<any> {
  const results = await searchExercises(name);
  return results[0] || null;
}

export async function searchByTarget(target: string): Promise<any> {
  const results = await searchExercises(target);
  return results[0] || null;
}
