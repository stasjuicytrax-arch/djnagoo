import { content } from '@/lib/content'

export default function App() {
  return (
    <main className="min-h-svh grid place-items-center">
      <h1 className="t-mega">
        {content.artist.wordmark}
        <span className="text-ember">.</span>
      </h1>
    </main>
  )
}
