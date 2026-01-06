import OpenAI from 'openai';
import { Workout } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a professional fitness coach AI. Your task is to generate personalized workout plans based on user input.

CRITICAL RULES:
1. Generate ONLY standard, well-known exercise names in English
2. NEVER invent new exercises or use unusual names
3. Use canonical exercise names that exist in fitness databases (e.g., "dumbbell bicep curl", "barbell squat", "push up", "lat pulldown")
4. Generate 6-8 exercises maximum
5. Consider any constraints mentioned (equipment, injuries, time, goals)
6. Output ONLY valid JSON - no explanations, no markdown, no text before or after

For targetHint, use one of these standard muscle groups:
- pectorals (chest)
- lats (back)
- delts (shoulders)
- biceps
- triceps
- quads
- hamstrings
- glutes
- calves
- abs
- forearms
- traps
- upper back

OUTPUT FORMAT (strict JSON only):
{
  "title": "Workout title - duration",
  "exercises": [
    {
      "name": "exercise name in lowercase",
      "targetHint": "primary muscle group",
      "sets": 3,
      "reps": "10-12",
      "restSec": 60,
      "note": "coaching tip or form cue"
    }
  ]
}

COMMON EXERCISE NAMES TO USE:
- push up, diamond push up, wide push up, decline push up
- dumbbell bench press, incline dumbbell bench press, dumbbell fly
- barbell bench press, incline barbell bench press
- pull up, chin up, lat pulldown, cable row, one arm dumbbell row
- barbell row, t bar row, seated cable row
- overhead press, dumbbell shoulder press, lateral raise, front raise
- face pull, reverse fly, shrugs
- barbell squat, goblet squat, leg press, lunges, leg extension
- romanian deadlift, leg curl, hip thrust
- barbell curl, dumbbell curl, hammer curl, preacher curl
- tricep pushdown, skull crusher, tricep dip, overhead tricep extension
- plank, crunch, russian twist, leg raise, dead bug
- calf raise, farmer walk

Remember: ONLY output the JSON object, nothing else.`;

export async function generateWorkout(userInput: string): Promise<Workout> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userInput },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from AI');
  }

  // Clean the response - remove any markdown code blocks if present
  let cleanContent = content.trim();
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.slice(7);
  }
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.slice(3);
  }
  if (cleanContent.endsWith('```')) {
    cleanContent = cleanContent.slice(0, -3);
  }
  cleanContent = cleanContent.trim();

  try {
    const workout = JSON.parse(cleanContent) as Workout;

    // Validate structure
    if (!workout.title || !Array.isArray(workout.exercises)) {
      throw new Error('Invalid workout structure');
    }

    // Validate and sanitize each exercise
    workout.exercises = workout.exercises.map((ex) => ({
      name: String(ex.name || '').toLowerCase().trim(),
      targetHint: String(ex.targetHint || '').toLowerCase().trim(),
      sets: Number(ex.sets) || 3,
      reps: String(ex.reps || '10'),
      restSec: Number(ex.restSec) || 60,
      note: String(ex.note || ''),
    }));

    return workout;
  } catch (error) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse workout from AI response');
  }
}
