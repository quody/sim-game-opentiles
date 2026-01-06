import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-3xl font-bold text-zinc-100">Sprite Tools</h1>
        <div className="flex gap-4">
          <Link
            href="/atlas-picker"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Atlas Picker
          </Link>
          <Link
            href="/game"
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
          >
            Game Demo
          </Link>
          <Link
            href="/world-generator"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
          >
            World Generator
          </Link>
        </div>
      </main>
    </div>
  );
}
