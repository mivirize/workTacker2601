import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const lp = await db.getLpById(id)

    if (!lp) {
      return NextResponse.json(
        { error: 'LP not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(lp)
  } catch (error) {
    console.error('Failed to get LP:', error)
    return NextResponse.json(
      { error: 'Failed to get LP' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const data = await req.json()

    const lp = await db.getLpById(id)
    if (!lp) {
      return NextResponse.json(
        { error: 'LP not found' },
        { status: 404 }
      )
    }

    // Update the LP
    const updatedLp = await db.updateLp(id, data)

    if (!updatedLp) {
      return NextResponse.json(
        { error: 'Failed to update LP' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedLp)
  } catch (error) {
    console.error('Failed to update LP:', error)
    return NextResponse.json(
      { error: 'Failed to update LP' },
      { status: 500 }
    )
  }
}
