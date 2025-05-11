import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { text } = await request.json();
  const apiKey = process.env.ELEVENLABS_API_KEY || 'sk_dbb226e209169e6075daec56a360d509ad776bb70d1e9d8f';
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'H6QPv2pQZDcGqLwDTIJQ';
  if (!apiKey || !voiceId) {
    return NextResponse.json({ error: 'Missing ElevenLabs configuration' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('ElevenLabs error:', errorBody);
      return NextResponse.json({ error: 'TTS API failed' }, { status: 502 });
    }

    const arrayBuffer = await res.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (err) {
    console.error('Internal TTS error:', err);
    return NextResponse.json({ error: 'Internal TTS error' }, { status: 500 });
  }
} 