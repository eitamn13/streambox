import { useStore } from '../store/useStore'
import { Home, Search, Tv, Trophy, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { Page } from '../types'

const navItems: { id: Page; label: string; icon: typeof Home; path: string }[] = [
  { id: 'home', label: 'בית', icon: Home, path: '/' },
  { id: 'search', label: 'חיפוש', icon: Search, path: '/search' },
  { id: 'tv', label: 'טלוויזיה', icon: Tv, path: '/tv' },
  { id: 'sports', label: 'ספורט', icon: Trophy, path: '/sports' },
  { id: 'profile', label: 'פרופיל', icon: User, path: '/profile' },
]

export default function BottomNav() {
  const currentPage = useStore((state) => state.currentPage)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/5 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.id
          const Icon = item.icon
          return (
            <Link
              key={item.id}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-16 h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-cyan rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                className={`transition-colors duration-200 ${
                  isActive ? 'text-cyan' : 'text-slate-secondary'
                }`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={`text-[10px] mt-0.5 font-medium transition-colors duration-200 ${
                  isActive ? 'text-cyan' : 'text-slate-secondary'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
