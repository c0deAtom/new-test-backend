import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Note id is required' }, { status: 400 });
    }

    // First, delete all tags associated with this note
    await prisma.$executeRaw`
      DELETE FROM "Tag" WHERE "noteId" = ${id}
    `;

    // Then delete the note
    await prisma.$executeRaw`
      DELETE FROM "Note" WHERE "id" = ${id}
    `;

    return NextResponse.json({ message: 'Note and associated tags deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
} 