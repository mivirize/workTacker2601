import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const secret = req.headers.get('x-webhook-secret')

    // Validate webhook secret
    if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    const { _type, slug, clientSlug, hearing } = body

    if (_type === 'lp') {
      // Revalidate specific LP page
      if (slug?.current && (clientSlug || hearing?.clientSlug?.current)) {
        const client = clientSlug ?? hearing?.clientSlug?.current
        revalidatePath(`/${client}/${slug.current}`)
      }
      // Revalidate LP list
      revalidateTag('lps')
      revalidatePath('/admin/lps')
    }

    if (_type === 'hearing') {
      // Revalidate hearing list
      revalidateTag('hearings')
      revalidatePath('/admin/hearings')
    }

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    )
  }
}
