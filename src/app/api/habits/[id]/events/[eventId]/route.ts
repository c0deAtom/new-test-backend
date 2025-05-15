import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: { eventId: string } }) {
  try {
    const eventId = params.eventId;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    const deleted = await prisma.habitEvent.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: 'Event deleted', deleted });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
