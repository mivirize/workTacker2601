import { NextResponse } from 'next/server'
import { db, generateSlug } from '@/lib/db'

export async function GET() {
  try {
    const hearings = await db.getAllHearings()
    return NextResponse.json(hearings)
  } catch (error) {
    console.error('Failed to get hearings:', error)
    return NextResponse.json(
      { error: 'Failed to get hearings' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    const hearing = await db.createHearing({
      clientName: data.clientName,
      clientSlug: {
        _type: 'slug',
        current: generateSlug(data.clientName),
      },
      contactPerson: data.contactPerson ?? undefined,
      contactEmail: data.contactEmail ?? undefined,
      productName: data.productName,
      productDescription: data.productDescription ?? undefined,
      uniqueSellingPoints: data.uniqueSellingPoints
        ?.map((usp: { value: string }) => usp.value)
        .filter((v: string) => v.trim() !== '') ?? [],
      priceInfo: data.priceInfo ?? undefined,
      targetAudience: data.targetAudience ?? undefined,
      painPoints: data.painPoints
        ?.map((p: { value: string }) => p.value)
        .filter((v: string) => v.trim() !== '') ?? [],
      desiredOutcome: data.desiredOutcome ?? undefined,
      templateTier: data.templateTier ?? 'simple',
      primaryColor: data.primaryColor ?? undefined,
      secondaryColor: data.secondaryColor ?? undefined,
      accentColor: data.accentColor ?? undefined,
      notes: data.notes ?? undefined,
      status: 'draft',
    })

    return NextResponse.json({ id: hearing._id })
  } catch (error) {
    console.error('Failed to create hearing:', error)
    return NextResponse.json(
      { error: 'Failed to create hearing' },
      { status: 500 }
    )
  }
}
