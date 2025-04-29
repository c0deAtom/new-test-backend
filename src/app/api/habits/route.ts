// app/api/habits/route.ts

import { NextResponse, NextRequest } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client"; // make sure you have prisma setup

const prisma = new PrismaClient();


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      name,
      goalType,
      microGoal,
      triggers,
      cravingNarrative,
      resistanceStyle,
      motivationOverride,
      reflectionDepthOverride,
      hitDefinition,
      slipDefinition,
    } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newHabit = await prisma.habit.create({
      data: {
        userId,
        name,
        goalType,
        microGoal,
        triggers: triggers || [],
        cravingNarrative,
        resistanceStyle,
        motivationOverride,
        reflectionDepthOverride,
        hitDefinition,
        slipDefinition,
      },
    });

    return NextResponse.json(newHabit, { status: 201 });
  } catch (error) {
    console.error("Error creating habit:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}





export async function GET() {
  try {
    const habits = await prisma.habit.findMany({
      include: {
        events: true,
      },
    });

    return NextResponse.json(habits);
  } catch (err) {
    console.error("Error fetching habits:", err);
    return NextResponse.json({ message: "Failed to fetch habits" }, { status: 500 });
  }
}





export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  try {
    // Delete logs first due to relation
    await prisma.habitEvent.deleteMany({
      where: { habitId: id },
    });

    // Delete the habit
    await prisma.habit.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Habit deleted" });
  } catch (err) {
    console.error("Error deleting habit:", err);
    return NextResponse.json({ message: "Failed to delete habit" }, { status: 500 });
  }
}


