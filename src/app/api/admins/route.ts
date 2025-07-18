import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient()

// GET all admins
export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    return NextResponse.json(admins)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}

// POST new admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password, role } = body

    const hashedPassword = await hashPassword(password);

    const admin = await prisma.admin.create({
      data: {
        email,
        name,
        password: hashedPassword, // Always store hashed password
        role: role || 'admin'
      },
    })

    return NextResponse.json(admin)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
  }
}