import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const agents = await prisma.agent.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error('[AGENTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, instructions } = body

    if (!name || !instructions) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const agent = await prisma.agent.create({
      data: {
        userId: session.user.id, // Type assertion might be needed if user.id is optional in types but we checked it
        name,
        description,
        instructions,
      },
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('[AGENTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
