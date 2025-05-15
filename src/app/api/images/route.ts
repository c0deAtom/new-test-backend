import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../../lib/prisma';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join(uploadDir, filename);
  fs.writeFileSync(filepath, buffer);
  const url = `/uploads/${filename}`;

  // Save to database
  const image = await prisma.image.create({
    data: {
      url,
      filename,
    },
  });

  return NextResponse.json({ image });
}

export async function GET() {
  // Fetch from database
  const images = await prisma.image.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ images });
} 