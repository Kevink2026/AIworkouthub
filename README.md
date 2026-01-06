# AI Workout Generator

A simple MVP web app that generates personalized workout plans using AI and displays exercise GIFs from ExerciseDB.

## Features

- **Natural Language Input**: Describe your workout preferences in any language (CZ/EN supported)
- **AI-Powered Generation**: Uses OpenAI GPT-4o-mini to create personalized workouts
- **Exercise GIFs**: Automatically fetches exercise demonstrations from ExerciseDB
- **Mobile-Friendly**: Responsive design that works on all devices

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- OpenAI API
- ExerciseDB API (via RapidAPI)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```
4. Add your API keys to `.env`:
   - `OPENAI_API_KEY` - Get from [OpenAI Platform](https://platform.openai.com)
   - `RAPIDAPI_KEY` - Get from [RapidAPI](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a description of your workout preferences in the text field
2. Examples:
   - "Home workout, I have dumbbells, shoulder injury, max 35 minutes"
   - "Upper body gym session, focus on chest and back, 45 minutes"
   - "Leg day, no equipment, apartment-friendly exercises"
3. Click "Generate Workout"
4. View your personalized workout with exercise GIFs

## API Endpoint

`POST /api/generate-workout`

Request body:
```json
{
  "userInput": "Your workout description here"
}
```

Response:
```json
{
  "title": "Workout Title",
  "exercises": [
    {
      "name": "exercise name",
      "targetHint": "muscle group",
      "sets": 3,
      "reps": "10-12",
      "restSec": 60,
      "note": "coaching tip",
      "gifUrl": "https://...",
      "equipment": "dumbbell",
      "target": "lats"
    }
  ]
}
```

## License

MIT
