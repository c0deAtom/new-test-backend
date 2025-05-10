import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tags: true },
    });
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content, tags } = await req.json();
    const note = await prisma.note.create({
      data: {
        content,
        tags: {
          create: (Array.isArray(tags) ? tags : []).map((name: string) => ({ name })),
        },
      },
      include: { tags: true },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, content, tags } = await req.json();
    if (!id) return NextResponse.json({ error: 'Note id is required' }, { status: 400 });
    // Update note content
    const note = await prisma.note.update({
      where: { id },
      data: {
        content,
        tags: {
          deleteMany: {},
          create: (Array.isArray(tags) ? tags : []).map((name: string) => ({ name })),
        },
      },
      include: { tags: true },
    });
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
} 