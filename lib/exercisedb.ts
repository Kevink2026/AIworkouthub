import { ExerciseDBResult } from './types';

// Using wger.de - free and open source fitness API
const WGER_BASE_URL = 'https://wger.de/api/v2';

interface WgerExercise {
  id: number;
  name: string;
  description: string;
  category: { id: number; name: string };
  muscles: { id: number; name: string }[];
  equipment: { id: number; name: string }[];
  images: { id: number; image: string }[];
}

interface WgerSearchResult {
  suggestions: {
    value: string;
    data: {
      id: number;
      name: string;
      category: string;
      image: string | null;
      image_thumbnail: string | null;
    };
  }[];
}

/**
 * Search for exercise on wger.de by name
 */
async function searchWger(name: string): Promise<{ gifUrl: string | null; name: string; equipment: string | null; target: string | null }> {
  try {
    // Use the search/autocomplete endpoint
    const searchUrl = `${WGER_BASE_URL}/exercise/search/?term=${encodeURIComponent(name)}&language=2`;
    console.log(`[Wger] Searching: ${searchUrl}`);

    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.error(`[Wger] Search failed: ${response.status}`);
      return { gifUrl: null, name, equipment: null, target: null };
    }

    const data: WgerSearchResult = await response.json();
    console.log(`[Wger] Found ${data.suggestions?.length || 0} suggestions`);

    if (data.suggestions && data.suggestions.length > 0) {
      const best = data.suggestions[0];
      console.log(`[Wger] Best match: ${best.data.name}, image: ${best.data.image || 'none'}`);

      // If we have an image, return it
      if (best.data.image) {
        return {
          gifUrl: best.data.image,
          name: best.data.name,
          equipment: null,
          target: best.data.category || null,
        };
      }

      // Try to get images from exercise detail endpoint
      const exerciseId = best.data.id;
      const detailUrl = `${WGER_BASE_URL}/exerciseimage/?exercise_base=${exerciseId}&limit=1`;
      console.log(`[Wger] Fetching images: ${detailUrl}`);

      const imageResponse = await fetch(detailUrl);
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        if (imageData.results && imageData.results.length > 0) {
          const imageUrl = imageData.results[0].image;
          console.log(`[Wger] Found image: ${imageUrl}`);
          return {
            gifUrl: imageUrl,
            name: best.data.name,
            equipment: null,
            target: best.data.category || null,
          };
        }
      }

      return {
        gifUrl: null,
        name: best.data.name,
        equipment: null,
        target: best.data.category || null,
      };
    }

    return { gifUrl: null, name, equipment: null, target: null };
  } catch (error) {
    console.error(`[Wger] Error:`, error);
    return { gifUrl: null, name, equipment: null, target: null };
  }
}

/**
 * Resolve an exercise - search on wger.de
 */
export async function resolveExercise(
  name: string,
  targetHint: string
): Promise<{ gifUrl: string | null; name: string; equipment: string | null; target: string | null }> {
  // Try searching by name first
  let result = await searchWger(name);

  // If no image found and we have a target hint, try searching by that
  if (!result.gifUrl && targetHint) {
    console.log(`[Wger] No image for "${name}", trying target: ${targetHint}`);
    const targetResult = await searchWger(`${targetHint} exercise`);
    if (targetResult.gifUrl) {
      return {
        ...targetResult,
        name: name, // Keep original exercise name
      };
    }
  }

  return result;
}

// Keep these for backward compatibility but they now use wger
export async function searchByName(name: string): Promise<ExerciseDBResult | null> {
  return null; // Not used anymore
}

export async function searchByTarget(target: string): Promise<ExerciseDBResult | null> {
  return null; // Not used anymore
}
