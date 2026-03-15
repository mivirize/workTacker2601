import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LP Generator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            クライアント向けランディングページ生成ツール
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="btn btn-primary text-lg px-8 py-3"
            >
              管理画面
            </Link>
            <Link
              href="/studio"
              className="btn btn-secondary text-lg px-8 py-3"
            >
              Sanity Studio
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
