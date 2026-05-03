import { motion, AnimatePresence } from 'framer-motion';
import { Home, Settings, Tv } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function Layout({ children }) {
  const { state, dispatch } = useApp();

  const showNav = ['home', 'input', 'results', 'tv'].includes(state.screen);

  return (
    <div className="min-h-screen bg-[#0a0a0f]" dir={state.settings.rtl ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        <motion.div
          key={state.screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={showNav ? 'pb-20' : ''}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {showNav && (
        <motion.nav
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#12121a]/90 backdrop-blur-lg border-t border-[#1a1a25]"
        >
          <div className="max-w-lg mx-auto flex items-center justify-around px-6 py-3">
            <button
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'home' })}
              className={`flex flex-col items-center gap-1 transition-colors ${
                state.screen === 'home' ? 'text-[#818cf8]' : 'text-[#4a4a6a] hover:text-[#9ca3af]'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'tv' })}
              className={`flex flex-col items-center gap-1 transition-colors ${
                state.screen === 'tv' ? 'text-[#818cf8]' : 'text-[#4a4a6a] hover:text-[#9ca3af]'
              }`}
            >
              <Tv className="w-5 h-5" />
              <span className="text-[10px] font-medium">Live TV</span>
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'settings' })}
              className={`flex flex-col items-center gap-1 transition-colors ${
                state.screen === 'settings' ? 'text-[#818cf8]' : 'text-[#4a4a6a] hover:text-[#9ca3af]'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[10px] font-medium">Settings</span>
            </button>
          </div>
        </motion.nav>
      )}
    </div>
  );
}
