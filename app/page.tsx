export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      
      {/* Фокси */}
      <img 
        src="/foksy.png" 
        alt="Фокси" 
        className="w-40 h-40 object-contain mb-6"
      />

      {/* Заглавие */}
      <h1 className="text-4xl font-medium text-zinc-900 mb-2">
        Здравей! Аз съм Фокси 🦊
      </h1>
      <p className="text-lg text-zinc-500 mb-8 text-center max-w-md">
        Твоят помощник за диктовки и правопис
      </p>

      {/* Бутон */}
      <button className="bg-orange-500 text-white text-lg font-medium px-8 py-4 rounded-2xl hover:bg-orange-600 transition-colors">
        Започни диктовка →
      </button>

    </main>
  )
}