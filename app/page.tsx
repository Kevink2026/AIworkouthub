'use client';

import { useState } from 'react';
import { EnrichedWorkout, EnrichedExercise } from '@/lib/types';

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [workout, setWorkout] = useState<EnrichedWorkout | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      setError('Please describe your workout preferences');
      return;
    }

    setLoading(true);
    setError(null);
    setWorkout(null);

    try {
      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate workout');
      }

      setWorkout(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>AI Workout Generator</h1>
        <p className="subtitle">
          Describe your situation and get a personalized workout
        </p>
      </header>

      <section className="input-section">
        <textarea
          className="input-field"
          placeholder="e.g., &quot;Dneska doma, mám jednoručky, bolí mě rameno, max 35 minut, chci pump&quot; or &quot;Upper body workout, 45 minutes, gym, focus on chest and back&quot;"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          rows={4}
          disabled={loading}
        />

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Workout'}
        </button>

        {error && <p className="error-message">{error}</p>}
      </section>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Creating your personalized workout...</p>
        </div>
      )}

      {workout && (
        <section className="workout-section">
          <h2 className="workout-title">{workout.title}</h2>

          <div className="exercises-grid">
            {workout.exercises.map((exercise, index) => (
              <ExerciseCard
                key={index}
                exercise={exercise}
                number={index + 1}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ExerciseCard({
  exercise,
  number,
}: {
  exercise: EnrichedExercise;
  number: number;
}) {
  return (
    <div className="exercise-card">
      <div className="exercise-number">{number}</div>

      <div className="exercise-content">
        <h3 className="exercise-name">{exercise.name}</h3>

        {exercise.gifUrl ? (
          <div className="gif-container">
            <img
              src={exercise.gifUrl}
              alt={exercise.name}
              className="exercise-gif"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="gif-placeholder">
            <span>No GIF available</span>
          </div>
        )}

        <div className="exercise-details">
          <div className="detail-row">
            <span className="detail-label">Sets</span>
            <span className="detail-value">{exercise.sets}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Reps</span>
            <span className="detail-value">{exercise.reps}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Rest</span>
            <span className="detail-value">{exercise.restSec}s</span>
          </div>
        </div>

        {exercise.equipment && (
          <div className="equipment-tag">{exercise.equipment}</div>
        )}

        {exercise.note && (
          <p className="coaching-tip">
            <strong>Tip:</strong> {exercise.note}
          </p>
        )}
      </div>
    </div>
  );
}
