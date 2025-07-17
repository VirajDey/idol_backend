import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { xHandle, name, characterDescription, setting, idolType, idolImage, launchTiming } = body;

    if (!xHandle || !name || !characterDescription || !setting || !idolType || !idolImage || !launchTiming) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newIdol = await prisma.idol.create({
      data: {
        xHandle,
        name,
        characterDescription,
        setting,
        idolType,
        idolImage,
        launchTiming: new Date(launchTiming),
      },
    });

    return NextResponse.json(newIdol, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('xHandle')) {
      return NextResponse.json({ error: 'X (Twitter) Handle already exists' }, { status: 409 });
    }
    console.error('Error creating idol:', error);
    return NextResponse.json({ error: 'Failed to create idol' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const idols = await prisma.idol.findMany();
    return NextResponse.json(idols, { status: 200 });
  } catch (error) {
    console.error('Error fetching idols:', error);
    return NextResponse.json({ error: 'Failed to fetch idols' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Idol ID is required" },
        { status: 400 }
      );
    }

    await prisma.idol.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Idol deleted successfully" });
  } catch (error) {
    console.error("Error deleting idol:", error);
    return NextResponse.json(
      { message: "Failed to delete idol" },
      { status: 500 }
    );
  }
}