import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { onboardingMovies } from '../data/mockData'

export default function Onboarding() {
  const { completeOnboarding, user } = useStore()
  const [step, setStep] = useState(0)
  const [selectedMovies, setSelectedMovies] = useState<number[]>([])

  const toggleMovie = (id: number) => {
    if (selectedMovies.includes(id)) {
      setSelectedMovies(selectedMovies.filter((m) => m !== id))
    } else if (selectedMovies.length < 5) {
      setSelectedMovies([...selectedMovies, id])
    }
  }

  const steps = [
    {
      title: 'ברוכים הבאים ל-StreamBox',
      subtitle: 'הדור הבא של סטרימינג',
      content: (
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyan to-electric-purple flex items-center justify-center shadow-[0_0_40px_rgba(0,212,255,0.3)]">
            <Sparkles size={40} className="text-white" />
          </div>
          <p className="text-slate-secondary">
            AI חכם שיודע בדייע מה אתה אוהב, ספורט חי, טלוויזיה, וכל התוכן העולמי במקום אחד.
          </p>
        </div>
      ),
    },
    {
      title: 'בחר 3 תכנים אהובים',
      subtitle: 'AI ילמד את הטעם שלך',
      content: (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {onboardingMovies.map((movie) => {
            const isSelected = selectedMovies.includes(movie.id)
            return (
              <motion.button
                key={movie.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleMovie(movie.id)}
                className={`relative aspect-[2/3] rounded-xl overflow-hidden transition-all ${
                  isSelected ? 'ring-2 ring-cyan scale-95' : 'hover:scale-105'
                }`}
              >
                <img
                  src={movie.poster_path}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-cyan/40 flex items-center justify-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan flex items-center justify-center">
                      <Check size={20} className="text-space-900" strokeWidth={3} />
                    </div>
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>
      ),
    },
    {
      title: 'מוכנים!',
      subtitle: 'בואו נתחיל',
      content: (
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyan to-electric-purple flex items-center justify-center shadow-[0_0_40px_rgba(0,212,255,0.3)]"
          >
            <Check size={40} className="text-white" strokeWidth={3} />
          </motion.div>
          <p className="text-slate-secondary">
            AI שלך כבר למד מה אתה אוהב. מוכן לגלות תוכן מדהים?
          </p>
        </div>
      ),
    },
  ]

  const currentStep = steps[step]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full flex-1 transition-all ${
                idx <= step ? 'bg-cyan' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-center mb-2">{currentStep.title}</h2>
            <p className="text-slate-secondary text-center mb-8">{currentStep.subtitle}</p>
            {currentStep.content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-slate-secondary hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
              חזרה
            </button>
          ) : (
            <div />
          )}

          {step < steps.length - 1 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && selectedMovies.length < 3}
              className="px-8 py-3 bg-cyan text-space-900 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan/90 transition-colors"
            >
              הבא
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={completeOnboarding}
              className="px-8 py-3 bg-gradient-to-r from-cyan to-electric-purple text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              בואו נתחיל! 🚀
            </motion.button>
          )}
        </div>

        {step === 1 && (
          <p className="text-center text-xs text-slate-secondary mt-4">
            נבחרו {selectedMovies.length} מתוך 3 לפחות
          </p>
        )}
      </motion.div>
    </div>
  )
}
