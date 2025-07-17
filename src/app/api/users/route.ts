import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const prisma = new PrismaClient()

// GET all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        walletAddress: true,
        status: true,
        verified: true,
        credits: true,
        joinedAt: true,
        updatedAt: true
      }
    })
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, walletAddress } = body

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password, // Note: In production, password should be hashed
        walletAddress,
        status: 'active',
        verified: false,
        credits: 0
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// PATCH update user
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password
    delete updateData.joinedAt

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}