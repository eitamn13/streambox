import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Flame, Clock, ChevronDown, Star, TrendingUp } from 'lucide-react'
import { sportEvents } from '../data/mockData'

const sportCategories = ['הכל', 'כדורגל', 'NBA', 'UFC', 'פורמולה 1', 'טניס', 'ליגת האלופות']

export default function Sports() {
  const [selectedCategory, setSelectedCategory] = useState('הכל')
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  const filteredEvents = selectedCategory === 'הכל'
    ? sportEvents
    : sportEvents.filter((e) => {
        if (selectedCategory === 'כדורגל') return e.league.includes('ליג') || e.league.includes('לה')
        if (selectedCategory === 'NBA') return e.league === 'NBA'
        if (selectedCategory === 'פורמולה 1') return e.league === 'פורמולה 1'
        return true
      })

  const liveEvents = filteredEvents.filter((e) => e.status === 'live')
  const upcomingEvents = filteredEvents.filter((e) => e.status === 'upcoming')

  return (
    <div className="min-h-screen pt-16 pb-24 px-4 md:px-8 max-w-screen-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Trophy size={24} className="text-electric-orange" />
          מרכז הספורט
        </h1>
        <p className="text-sm text-slate-secondary mb-6">כל המשחקים, התוצאות וההיילייטס במקום אחד</p>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1">
          {sportCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-electric-orange text-white'
                  : 'glass hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Live matches section */}
        {liveEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Flame size={18} className="text-red-500" />
              משחקים חיים
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-2xl p-5 relative overflow-hidden"
                >
                  {/* Live indicator line */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                      <span className="text-xs font-bold text-red-400">חי</span>
                    </div>
                    <span className="text-xs text-slate-secondary">{event.league}</span>
                    <button
                      onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                    >
                      <ChevronDown
                        size={16}
                        className={`text-slate-secondary transition-transform ${
                          expandedEvent === event.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-lg font-bold">{event.homeTeam}</p>
                      {event.isFavorite && <Star size={12} className="text-cyan mx-auto mt-1" fill="currentColor" />}
                    </div>
                    <div className="px-6">
                      <div className="text-3xl font-black text-cyan">
                        {event.homeScore} - {event.awayScore}
                      </div>
                      <div className="text-xs text-center text-slate-secondary mt-1">
                        {event.minute ? `דקה ${event.minute}` : event.timeRemaining}
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-lg font-bold">{event.awayTeam}</p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedEvent === event.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp size={14} className="text-cyan" />
                            <span>סטטיסטיקות משחק בזמן אמת</span>
                          </div>
                          <div className="flex gap-2">
                            <button className="flex-1 py-2 rounded-lg bg-cyan/20 text-cyan text-sm font-medium hover:bg-cyan/30 transition-colors">
                              צפה בשידור
                            </button>
                            <button className="flex-1 py-2 rounded-lg glass text-sm hover:bg-white/10 transition-colors">
                              היילייטס
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming matches */}
        {upcomingEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-cyan" />
              קרובים
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-center">
                      <p className="text-sm font-bold">{event.homeTeam}</p>
                    </div>
                    <div className="text-xs text-slate-secondary">VS</div>
                    <div className="text-center">
                      <p className="text-sm font-bold">{event.awayTeam}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-cyan">{event.timeRemaining}</span>
                    <p className="text-xs text-slate-secondary">{event.league}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
