import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET tasks for a case
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const caseId = new URL(request.url).searchParams.get('caseId')
  if (!caseId) return NextResponse.json({ error: 'caseId required' }, { status: 400 })

  const tasks = await prisma.task.findMany({
    where: { caseId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ tasks })
}

// POST create task
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, caseId, dueDate } = await request.json()
  if (!title || !caseId) return NextResponse.json({ error: 'title and caseId required' }, { status: 400 })

  const task = await prisma.task.create({
    data: { title, caseId, dueDate: dueDate ? new Date(dueDate) : null },
  })
  return NextResponse.json({ task })
}

// PATCH toggle done / update title
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, done, title } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(done !== undefined ? { done } : {}),
      ...(title !== undefined ? { title } : {}),
    },
  })
  return NextResponse.json({ task })
}

// DELETE task
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
