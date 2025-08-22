import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Buscar configurações do usuário
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    // Se não existir, retornar configurações padrão
    if (!settings) {
      return NextResponse.json({
        userId,
        defaultStartTime: null,
        defaultEndTime: null,
        workingDays: 'weekdays',
      });
    }

    return NextResponse.json({
      userId: settings.userId,
      defaultStartTime: settings.defaultStartTime,
      defaultEndTime: settings.defaultEndTime,
      workingDays: settings.workingDays,
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, defaultStartTime, defaultEndTime, workingDays } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Validar workingDays
    if (workingDays && !['weekdays', 'all', 'weekends'].includes(workingDays)) {
      return NextResponse.json({ error: 'Invalid workingDays value' }, { status: 400 });
    }

    // Validar formato de horários (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (defaultStartTime && !timeRegex.test(defaultStartTime)) {
      return NextResponse.json({ error: 'Invalid defaultStartTime format (use HH:MM)' }, { status: 400 });
    }
    if (defaultEndTime && !timeRegex.test(defaultEndTime)) {
      return NextResponse.json({ error: 'Invalid defaultEndTime format (use HH:MM)' }, { status: 400 });
    }

    // Upsert configurações do usuário
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        defaultStartTime,
        defaultEndTime,
        workingDays: workingDays || 'weekdays',
      },
      create: {
        userId,
        defaultStartTime,
        defaultEndTime,
        workingDays: workingDays || 'weekdays',
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving user settings:', error);
    return NextResponse.json(
      { error: 'Failed to save user settings' },
      { status: 500 }
    );
  }
}
