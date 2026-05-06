import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Settings, Subtitles } from 'lucide-react'
import { useStore } from '../store/useStore'
import MovieCard from './MovieCard'
import { mockMovies } from '../data/mockData'

export default function Player() {
  const { currentMedia, closePlayer } = useStore()
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [quality, setQuality] = useState('4K')
  const [subtitleLang, setSubtitleLang] = useState<'he' | 'en' | 'off'>('he')
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 100
          }
          return prev + 0.05
        })
      }, 100)
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [isPlaying])

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  const formatTime = (percent: number) => {
    const totalSeconds = 7200 // 2 hours
    const currentSeconds = Math.floor((percent / 100) * totalSeconds)
    const hours = Math.floor(currentSeconds / 3600)
    const mins = Math.floor((currentSeconds % 3600) / 60)
    const secs = currentSeconds % 60
    if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const relatedMovies = mockMovies
    .filter((m) => m.id !== currentMedia?.id && m.genre_ids.some((g) => currentMedia?.genre_ids.includes(g)))
    .slice(0, 6)

  if (!currentMedia) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
    >
      {/* Video area */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        <img
          src={currentMedia.backdrop_path}
          alt={currentMedia.title}
          className="w-full h-full object-cover opacity-80"
        />
        
        {/* Play overlay when paused */}
        {!isPlaying && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40"
            onClick={() => setIsPlaying(true)}
          >
            <div className="w-20 h-20 rounded-full bg-cyan/90 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <Play size={32} className="text-space-900 ml-1" fill="currentColor" />
            </div>
          </motion.div>
        )}

        {/* Top controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={closePlayer}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="text-center">
                  <h2 className="text-lg font-bold">{currentMedia.title}</h2>
                  <p className="text-xs text-slate-secondary">{currentMedia.platform} • {currentMedia.vote_average} ⭐</p>
                </div>
                <div className="w-10" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
            >
              {/* Progress bar */}
              <div className="mb-4">
                <div className="relative h-1 bg-white/20 rounded-full cursor-pointer group">
                  <div
                    className="absolute h-full bg-cyan rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="absolute h-4 w-4 bg-cyan rounded-full -translate-y-1/2 top-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-secondary mt-1">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(100)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Subtitles size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <SkipBack size={18} />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-14 h-14 rounded-full bg-cyan flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    {isPlaying ? (
                      <Pause size={24} className="text-space-900" fill="currentColor" />
                    ) : (
                      <Play size={24} className="text-space-900 ml-1" fill="currentColor" />
                    )}
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <SkipForward size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <Settings size={18} />
                    </button>
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute bottom-full right-0 mb-2 w-48 glass-strong rounded-xl border border-white/10 p-3"
                        >
                          <div className="space-y-3">
                            <div>
                              <span className="text-xs text-slate-secondary block mb-1">איכות</span>
                              <div className="flex gap-1">
                                {['720p', '1080p', '4K'].map((q) => (
                                  <button
                                    key={q}
                                    onClick={() => setQuality(q)}
                                    className={`flex-1 text-xs py-1 rounded-md transition-colors ${
                                      quality === q ? 'bg-cyan text-space-900 font-bold' : 'bg-white/5 hover:bg-white/10'
                                    }`}
                                  >
                                    {q}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-slate-secondary block mb-1">כתוביות</span>
                              <div className="flex gap-1">
                                {[
                                  { val: 'he', label: 'עברית' },
                                  { val: 'en', label: 'English' },
                                  { val: 'off', label: 'ללא' },
                                ].map((s) => (
                                  <button
                                    key={s.val}
                                    onClick={() => setSubtitleLang(s.val as typeof subtitleLang)}
                                    className={`flex-1 text-xs py-1 rounded-md transition-colors ${
                                      subtitleLang === s.val ? 'bg-cyan text-space-900 font-bold' : 'bg-white/5 hover:bg-white/10'
                                    }`}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Maximize size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Related content - only show on desktop or when controls visible */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-24 left-0 right-0 px-4 hidden lg:block"
          >
            <div className="max-w-screen-xl mx-auto">
              <h3 className="text-sm font-bold mb-3 text-slate-secondary">תכנים דומים</h3>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                {relatedMovies.map((movie, idx) => (
                  <div key={movie.id} className="w-[140px] flex-shrink-0">
                    <MovieCard movie={movie} index={idx} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
