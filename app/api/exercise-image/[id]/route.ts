import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'exercisedb.p.rapidapi.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Try multiple image URL patterns with RapidAPI authentication
  const imageUrls = [
    `https://${RAPIDAPI_HOST}/image/${id}`,
    `https://${RAPIDAPI_HOST}/exercises/image/${id}`,
    `https://${RAPIDAPI_HOST}/gif/${id}`,
  ];

  for (const url of imageUrls) {
    console.log(`[ImageProxy] Trying: ${url}`);
    try {
      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
      });

      console.log(`[ImageProxy] ${url} - Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';

        // If it's an image, proxy it
        if (contentType.includes('image')) {
          const imageBuffer = await response.arrayBuffer();
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }

        // If it's JSON, check for gifUrl
        if (contentType.includes('json')) {
          const data = await response.json();
          if (data.gifUrl) {
            console.log(`[ImageProxy] Found gifUrl in JSON: ${data.gifUrl}`);
            return NextResponse.redirect(data.gifUrl);
          }
        }
      }
    } catch (error) {
      console.error(`[ImageProxy] Error fetching ${url}:`, error);
    }
  }

  // Fallback: return placeholder
  console.log(`[ImageProxy] No image found for ID: ${id}`);
  return NextResponse.redirect(
    `https://via.placeholder.com/400x400/1a1a1a/667eea?text=${encodeURIComponent(id)}`
  );
}
