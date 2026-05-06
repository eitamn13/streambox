import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { AnimatePresence } from 'framer-motion'

// Pages
import Home from './pages/Home'
import Search from './pages/Search'
import TV from './pages/TV'
import Sports from './pages/Sports'
import Profile from './pages/Profile'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'

// Components
import BottomNav from './components/BottomNav'
import AIChat from './components/AIChat'
import Player from './components/Player'
import SportsTicker from './components/SportsTicker'

function AppRoutes() {
  const { isAuthenticated, showOnboarding, currentPage, setCurrentPage, isPlayerOpen, setIsScrolled } = useStore()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [setIsScrolled])

  useEffect(() => {
    const path = location.pathname.slice(1) || 'home'
    if (['home', 'search', 'tv', 'sports', 'profile'].includes(path)) {
      setCurrentPage(path as typeof currentPage)
    }
  }, [location, setCurrentPage])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (!isAuthenticated) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (showOnboarding) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    )
  }

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/tv" element={<TV />} />
      <Route path="/sports" element={<Sports />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}

export default function App() {
  const { isAuthenticated, showOnboarding, isPlayerOpen } = useStore()
  const showNav = isAuthenticated && !showOnboarding && !isPlayerOpen

  return (
    <div className="min-h-screen bg-space-900 text-white overflow-x-hidden">
      <AnimatePresence mode="wait">
        <AppRoutes />
      </AnimatePresence>

      {showNav && <SportsTicker />}
      {showNav && <AIChat />}
      {isPlayerOpen && <Player />}
      {showNav && <BottomNav />}
    </div>
  )
}
