import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Play, Info } from 'lucide-react'
import { useStore } from '../store/useStore'
import { getYear, formatRuntime } from '../utils/helpers'
import type { Movie } from '../types'

interface MovieCardProps {
  movie: Movie
  index?: number
  showProgress?: boolean
}

export default function MovieCard({ movie, index = 0, showProgress = false }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const openPlayer = useStore((state) => state.openPlayer)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative flex-shrink-0 w-[160px] md:w-[200px] cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden card-depth transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]">
        <img
          src={movie.poster_path}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-gradient-to-t from-space-900/95 via-space-900/50 to-transparent flex flex-col justify-end p-3"
        >
          <div className="flex gap-2 mb-2">
            <button
              onClick={(e) => { e.stopPropagation(); openPlayer(movie) }}
              className="flex-1 flex items-center justify-center gap-1 bg-cyan text-space-900 rounded-lg py-1.5 text-xs font-bold hover:bg-cyan/90 transition-colors"
            >
              <Play size={12} fill="currentColor" />
              צפה
            </button>
            <button className="flex items-center justify-center w-8 h-8 glass rounded-lg hover:bg-white/10 transition-colors">
              <Info size={14} />
            </button>
          </div>
        </motion.div>

        {/* Live badge */}
        {movie.isLive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500/90 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            <span className="text-[10px] font-bold">חי</span>
          </div>
        )}

        {/* New badge */}
        {movie.isNew && !movie.isLive && (
          <div className="absolute top-2 right-2 bg-cyan/90 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <span className="text-[10px] font-bold text-space-900">חדש</span>
          </div>
        )}

        {/* Platform badge */}
        {movie.platform && (
          <div className="absolute top-2 left-2 glass px-1.5 py-0.5 rounded">
            <span className="text-[9px] text-slate-secondary">{movie.platform}</span>
          </div>
        )}

        {/* Progress bar */}
        {showProgress && movie.progress !== undefined && movie.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-cyan"
              style={{ width: `${movie.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Info below card */}
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-medium truncate group-hover:text-cyan transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-0.5">
            <Star size={10} className="text-cyan fill-cyan" />
            <span className="text-xs text-cyan font-semibold">{movie.vote_average.toFixed(1)}</span>
          </div>
          <span className="text-xs text-slate-secondary">{getYear(movie.release_date)}</span>
          {movie.runtime && (
            <span className="text-xs text-slate-secondary">{formatRuntime(movie.runtime)}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
