import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, Mic, Sparkles, Clock, TrendingUp, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { mockMovies, genreCategories } from '../data/mockData'
import MovieCard from '../components/MovieCard'
import { generateAIResponse } from '../utils/helpers'

const recentSearches = ['אקשן', 'סדרה ישראלית', 'NBA', 'מדע בדיוני']

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(mockMovies)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults(mockMovies)
      setAiSuggestion(null)
      return
    }

    const filtered = mockMovies.filter(
      (m) =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.overview.toLowerCase().includes(query.toLowerCase()) ||
        m.genre_ids.some((g) => genreCategories.some((gc) => gc.id === g && gc.name.includes(query)))
    )

    setResults(filtered)

    // AI suggestion for certain queries
    if (query.length > 3) {
      const response = generateAIResponse(query)
      if (response.suggestions) {
        setAiSuggestion(response.text)
      }
    }
  }, [query])

  const handleSmartSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    const response = generateAIResponse(searchQuery)
    setAiSuggestion(response.text)
  }

  return (
    <div className="min-h-screen pt-12 pb-24 px-4 md:px-8 max-w-screen-xl mx-auto">
      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-12 z-30 py-4"
      >
        <div className="relative">
          <SearchIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-secondary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש חכם - נסה 'בא לי משהו מטורף' או 'סדרה ממכרת'"
            className="w-full h-12 pr-11 pl-12 bg-space-800 border border-white/10 rounded-2xl text-sm outline-none focus:border-cyan/50 transition-colors placeholder:text-slate-secondary/50"
            dir="rtl"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute left-11 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={12} />
            </button>
          )}
          <button
            onClick={() => setIsListening(!isListening)}
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isListening ? 'bg-cyan/20 text-cyan animate-pulse' : 'bg-white/5 text-slate-secondary hover:bg-white/10'
            }`}
          >
            <Mic size={16} />
          </button>
        </div>
      </motion.div>

      {/* AI Suggestion */}
      <AnimatePresence>
        {aiSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="glass-card rounded-2xl p-4 border border-cyan/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-cyan" />
                <span className="text-sm font-bold text-cyan">AI ממליץ</span>
              </div>
              <p className="text-sm text-slate-secondary">{aiSuggestion}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart suggestions when no query */}
      {!query && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Quick actions */}
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-cyan" />
              חיפוש חכם
            </h3>
            <div className="flex flex-wrap gap-2">
              {['בא לי משהו מטורף', 'סדרה ממכרת', 'סרט אקשן טוב', 'מה חם עכשיו', 'משהו ממכר', 'כדורגל', 'NBA', 'סדרה טובה ללילה'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSmartSearch(suggestion)}
                  className="px-4 py-2 rounded-xl bg-space-800 border border-white/5 text-sm hover:border-cyan/30 hover:bg-cyan/5 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Recent searches */}
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Clock size={14} className="text-slate-secondary" />
              חיפושים אחרונים
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => setQuery(search)}
                  className="px-4 py-2 rounded-xl glass text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <Clock size={12} className="text-slate-secondary" />
                  {search}
                </button>
              ))}
            </div>
          </div>

          {/* Trending searches */}
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-electric-orange" />
              חיפושים פופולריים
            </h3>
            <div className="space-y-2">
              {['ניאון דרימס', 'ברצלונה', 'UFC', 'תל אביב 3000', 'מלחמת העולמות'].map((term, idx) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl glass hover:bg-white/5 transition-colors text-right"
                >
                  <span className="text-cyan font-bold text-sm">{idx + 1}</span>
                  <span className="text-sm">{term}</span>
                  <TrendingUp size={14} className="text-electric-orange mr-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div>
            <h3 className="text-sm font-bold mb-3">ז'אנרים</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {genreCategories.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setQuery(genre.name)}
                  className="p-3 rounded-xl glass hover:bg-white/5 transition-colors text-center"
                >
                  <span className="text-2xl block mb-1">{genre.emoji}</span>
                  <span className="text-sm">{genre.name}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {query && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <p className="text-sm text-slate-secondary">
            {results.length} תוצאות ל-"{query}"
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {results.map((movie, idx) => (
              <MovieCard key={movie.id} movie={movie} index={idx} />
            ))}
          </div>
          {results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-secondary mb-4">לא מצאנו תוצאות לחיפוש שלך</p>
              <button
                onClick={() => handleSmartSearch(query)}
                className="px-4 py-2 rounded-xl bg-cyan/20 text-cyan text-sm hover:bg-cyan/30 transition-colors"
              >
                שאל את AI
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
