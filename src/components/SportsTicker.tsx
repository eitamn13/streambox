import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Clock } from 'lucide-react'
import { sportEvents } from '../data/mockData'
import type { SportEvent } from '../types'

export default function SportsTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [events, setEvents] = useState<SportEvent[]>(sportEvents)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [events.length])

  useEffect(() => {
    const liveInterval = setInterval(() => {
      setEvents((prev) =>
        prev.map((event) => {
          if (event.status === 'live' && event.minute && event.minute < 90) {
            return { ...event, minute: event.minute + 1 }
          }
          return event
        })
      )
    }, 60000)
    return () => clearInterval(liveInterval)
  }, [])

  const currentEvent = events[currentIndex]

  if (!currentEvent) return null

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-space-900 via-space-800 to-space-900 border-b border-cyan/10"
    >
      <div className="max-w-screen-xl mx-auto px-4 h-9 flex items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentEvent.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="flex items-center gap-1.5">
              {currentEvent.status === 'live' ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <Flame size={12} className="text-electric-orange" />
                  <span className="text-electric-orange font-semibold">חי</span>
                </>
              ) : (
                <Clock size={12} className="text-cyan" />
              )}
            </div>

            <span className="text-slate-secondary">{currentEvent.league}</span>
            <span className="font-medium">
              {currentEvent.homeTeam} {currentEvent.homeScore} - {currentEvent.awayScore} {currentEvent.awayTeam}
            </span>
            {currentEvent.minute && (
              <span className="text-cyan font-mono text-xs">דקה {currentEvent.minute}</span>
            )}
            {currentEvent.timeRemaining && !currentEvent.minute && (
              <span className="text-cyan text-xs">{currentEvent.timeRemaining}</span>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="hidden md:flex items-center gap-1">
          {events.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-4 bg-cyan' : 'w-1 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
