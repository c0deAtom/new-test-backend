import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { message } = await request.json();
  // Echo the incoming message
  const responseText = `Echo: ${message}`;
  return NextResponse.json({ message: responseText });
} 