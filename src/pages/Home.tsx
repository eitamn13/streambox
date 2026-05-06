import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { getGreeting, getBackgroundGradient } from '../utils/helpers'
import { mockMovies } from '../data/mockData'
import Hero from '../components/Hero'
import ContentRow from '../components/ContentRow'
import type { Movie } from '../types'

export default function Home() {
  const user = useStore((state) => state.user)
  const isScrolled = useStore((state) => state.isScrolled)
  const [gradient, setGradient] = useState('')
  const [featured, setFeatured] = useState<Movie | null>(null)

  useEffect(() => {
    setGradient(getBackgroundGradient())
    // Pick a featured movie (trending with highest rating)
    const trending = mockMovies.filter((m) => m.isTrending || m.isNew)
    setFeatured(trending[0] || mockMovies[0])
  }, [])

  const continueWatching = mockMovies.filter((m) => m.progress && m.progress > 0)
  const trending = mockMovies.filter((m) => m.isTrending)
  const newReleases = mockMovies.filter((m) => m.isNew)
  const actionMovies = mockMovies.filter((m) => m.genre_ids.includes(28))
  const dramaMovies = mockMovies.filter((m) => m.genre_ids.includes(18))
  const comedyMovies = mockMovies.filter((m) => m.genre_ids.includes(35))
  const sciFiMovies = mockMovies.filter((m) => m.genre_ids.includes(878))

  return (
    <div className="min-h-screen pb-20" style={{ background: gradient }}>
      {/* Top greeting bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`fixed top-9 left-0 right-0 z-40 px-4 md:px-8 py-3 transition-all duration-300 ${
          isScrolled ? 'glass-strong' : ''
        }`}
      >
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <h2 className="text-lg md:text-2xl font-bold">
            {getGreeting(user?.name || 'איתן')}
          </h2>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-electric-purple flex items-center justify-center text-sm font-bold shadow-lg">
            {(user?.name || 'איתן')[0]}
          </div>
        </div>
      </motion.div>

      {/* Hero */}
      {featured && <Hero featured={featured} />}

      {/* Content Rows */}
      <div className="relative z-10 -mt-8">
        {continueWatching.length > 0 && (
          <ContentRow
            title="המשך צפייה"
            movies={continueWatching}
            showProgress
          />
        )}

        <ContentRow
          title="חם עכשיו"
          emoji="🔥"
          movies={trending}
        />

        <ContentRow
          title="מומלץ עבורך"
          emoji="🤖"
          movies={[...mockMovies].sort(() => Math.random() - 0.5).slice(0, 6)}
        />

        <ContentRow
          title="חדש הזהב"
          emoji="✨"
          movies={newReleases}
        />

        <ContentRow
          title="אקשן מטורף"
          emoji="💥"
          movies={actionMovies}
        />

        <ContentRow
          title="דרמה עמוקה"
          emoji="🎭"
          movies={dramaMovies}
        />

        <ContentRow
          title="קומדיה"
          emoji="😂"
          movies={comedyMovies}
        />

        <ContentRow
          title="מדע בדיוני"
          emoji="🚀"
          movies={sciFiMovies}
        />

        <ContentRow
          title="ממכר"
          emoji="📺"
          movies={[...mockMovies].filter(m => m.media_type === 'tv' || m.vote_average > 8.5)}
        />
      </div>
    </div>
  )
}
