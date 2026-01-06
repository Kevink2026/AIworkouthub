import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'exercisedb.p.rapidapi.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Try to fetch image from ExerciseDB through RapidAPI
  const imageUrl = `https://${RAPIDAPI_HOST}/exercises/exercise/${id}`;

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      // Return a placeholder or error image
      return NextResponse.redirect(
        'https://via.placeholder.com/400x400/1a1a1a/666?text=Exercise'
      );
    }

    const exercise = await response.json();

    // Check if response has gifUrl
    if (exercise.gifUrl) {
      return NextResponse.redirect(exercise.gifUrl);
    }

    // Try to construct URL from ID
    const possibleUrls = [
      `https://v2.exercisedb.io/image/${id}`,
      `http://d205bpvrqc9yn1.cloudfront.net/${id}.gif`,
    ];

    // Return placeholder if no GIF found
    return NextResponse.redirect(
      'https://via.placeholder.com/400x400/1a1a1a/666?text=No+GIF'
    );
  } catch (error) {
    return NextResponse.redirect(
      'https://via.placeholder.com/400x400/1a1a1a/666?text=Error'
    );
  }
}
