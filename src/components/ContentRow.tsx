import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import MovieCard from './MovieCard'
import type { Movie } from '../types'

interface ContentRowProps {
  title: string
  emoji?: string
  movies: Movie[]
  showProgress?: boolean
}

export default function ContentRow({ title, emoji, movies, showProgress = false }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = direction === 'left' ? -400 : 400
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  if (movies.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="py-4 md:py-6"
    >
      <div className="px-4 md:px-8 max-w-screen-xl mx-auto mb-3 flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
          {emoji && <span>{emoji}</span>}
          <span>{title}</span>
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto hide-scrollbar px-4 md:px-8 pb-2"
          dir="rtl"
        >
          {movies.map((movie, idx) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              index={idx}
              showProgress={showProgress}
            />
          ))}
        </div>
        
        {/* Fade edges */}
        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-space-900 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-space-900 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  )
}
