export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="mt-4 text-lg text-foreground">FAQページが見つかりませんでした</p>
        <p className="mt-2 text-sm text-muted-foreground">
          URLが正しいかご確認ください
        </p>
      </div>
    </main>
  );
}
