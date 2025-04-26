import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a sample user
  const user = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      personalityInsights: 'Highly motivated individual with a strong desire for self-improvement. Shows resilience in challenging situations and values consistency in daily routines.',
    }
  });

  // Create 5 habits for the user
  const habits = await Promise.all([
    // Meditation Habit
    prisma.habit.create({
      data: {
        title: 'Daily Meditation',
        description: '15 minutes of mindfulness meditation',
        positiveCues: ['morning sunlight', 'quiet space', 'meditation app'],
        negativeTriggers: ['noise', 'distractions', 'lack of time'],
        motivators: ['mental clarity', 'stress reduction', 'spiritual growth'],
        successFactors: ['waking up early', 'dedicated space', 'guided sessions'],
        userId: user.id
      }
    }),
    // Exercise Habit
    prisma.habit.create({
      data: {
        title: 'Regular Exercise',
        description: '30 minutes of physical activity',
        positiveCues: ['workout clothes ready', 'gym bag packed', 'favorite playlist'],
        negativeTriggers: ['tiredness', 'bad weather', 'work stress'],
        motivators: ['health improvement', 'energy boost', 'weight management'],
        successFactors: ['scheduled time', 'workout buddy', 'varied routines'],
        userId: user.id
      }
    }),
    // Reading Habit
    prisma.habit.create({
      data: {
        title: 'Daily Reading',
        description: 'Read for 30 minutes',
        positiveCues: ['comfortable chair', 'good lighting', 'bookmark ready'],
        negativeTriggers: ['screen fatigue', 'noise', 'distractions'],
        motivators: ['knowledge gain', 'relaxation', 'personal growth'],
        successFactors: ['interesting books', 'quiet environment', 'consistent time'],
        userId: user.id
      }
    }),
    // Healthy Eating Habit
    prisma.habit.create({
      data: {
        title: 'Healthy Eating',
        description: 'Maintain balanced diet',
        positiveCues: ['meal prep', 'healthy snacks', 'water bottle'],
        negativeTriggers: ['junk food ads', 'social pressure', 'stress'],
        motivators: ['better health', 'weight goals', 'energy levels'],
        successFactors: ['meal planning', 'healthy alternatives', 'portion control'],
        userId: user.id
      }
    }),
    // Sleep Habit
    prisma.habit.create({
      data: {
        title: 'Quality Sleep',
        description: '8 hours of quality sleep',
        positiveCues: ['dark room', 'comfortable bed', 'relaxing routine'],
        negativeTriggers: ['screen time', 'caffeine', 'stress'],
        motivators: ['better focus', 'energy levels', 'health'],
        successFactors: ['consistent bedtime', 'no screens', 'relaxation techniques'],
        userId: user.id
      }
    })
  ]);

  // Create multiple events for each habit
  for (const habit of habits) {
    // Create 10 events for each habit (mix of hits and slips)
    await Promise.all([
      // Hits
      prisma.habitEvent.create({
        data: {
          habitId: habit.id,
          userId: user.id,
          type: 'hit',
          notes: 'Great progress today!'
        }
      }),
      prisma.habitEvent.create({
        data: {
          habitId: habit.id,
          userId: user.id,
          type: 'hit',
          notes: 'Felt very motivated and accomplished'
        }
      }),
      prisma.habitEvent.create({
        data: {
          habitId: habit.id,
          userId: user.id,
          type: 'hit',
          notes: 'Stayed consistent with the routine'
        }
      }),
      prisma.habitEvent.create({
        data: {
          habitId: habit.id,
          userId: user.id,
          type: 'hit',
          notes: 'Overcame initial resistance'
        }
      }),
      prisma.habitEvent.create({
        data: {
          habitId: habit.id,
          userId: user.id,
          type: 'hit',
          notes: 'Made it a priority today'
        }
      }),
      // Slips
      prisma.habitEvent.create({
        data: {
          habitId: habit.id,
          userId: user.id,
          type: 'slip',
          notes: 'Faced unexpected challenges'
        }
      }),
      prisma.habitEvent.create({
        data: {
          habitId: habit.id,
          userId: user.id,
          type: 'slip',
          notes: 'Let stress get in the way'
        }
      }),
      prisma.habitEvent.create({
        data: {
          habitId: habit.id,
          userId: user.id,
          type: 'slip',
          notes: 'Lost motivation temporarily'
        }
      }),
      prisma.habitEvent.create({
        data: {
          habitId: habit.id,
          userId: user.id,
          type: 'slip',
          notes: 'Got distracted by other priorities'
        }
      }),
      prisma.habitEvent.create({
        data: {
          habitId: habit.id,
          userId: user.id,
          type: 'slip',
          notes: 'Felt too tired to continue'
        }
      })
    ]);
  }

  console.log('✅ Database seeding completed');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 