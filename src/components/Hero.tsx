import { motion } from 'framer-motion'
import { Play, Info, Star, Volume2, VolumeX } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { getYear, formatRuntime } from '../utils/helpers'
import type { Movie } from '../types'

interface HeroProps {
  featured: Movie
}

export default function Hero({ featured }: HeroProps) {
  const [isMuted, setIsMuted] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const openPlayer = useStore((state) => state.openPlayer)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500)
    return () => clearTimeout(timer)
  }, [featured])

  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          src={featured.backdrop_path}
          alt={featured.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-space-900 via-space-900/60 to-transparent" />
        <div className="absolute inset-0 cinematic-gradient" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end pb-16 md:pb-24 px-4 md:px-8 max-w-screen-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-2xl"
        >
          {/* Badges */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-cyan/20 text-cyan text-xs font-bold rounded-md border border-cyan/30">
              {featured.platform}
            </span>
            {featured.isNew && (
              <span className="px-2 py-0.5 bg-electric-purple/20 text-electric-purple text-xs font-bold rounded-md border border-electric-purple/30">
                חדש הזהב ✨
              </span>
            )}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 text-xs rounded-md">
              <Star size={10} className="text-cyan fill-cyan" />
              <span>{featured.vote_average}</span>
            </div>
            <span className="text-xs text-slate-secondary">{getYear(featured.release_date)}</span>
            {featured.runtime && (
              <span className="text-xs text-slate-secondary">{formatRuntime(featured.runtime)}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            {featured.title}
          </h1>

          {/* Description */}
          <p className="text-sm md:text-base text-slate-secondary mb-6 line-clamp-3 max-w-lg">
            {featured.overview}
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openPlayer(featured)}
              className="flex items-center gap-2 bg-cyan text-space-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-cyan/90 transition-colors"
            >
              <Play size={18} fill="currentColor" />
              צפה עכשיו
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 glass px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors"
            >
              <Info size={18} />
              מידע נוסף
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMuted(!isMuted)}
              className="w-11 h-11 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Ambient glow at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-space-900 to-transparent" />
    </div>
  )
}
