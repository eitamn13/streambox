import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Tv } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import AnimatedPage from './ui/AnimatedPage';

export default function HomeScreen() {
  const { dispatch } = useApp();

  return (
    <AnimatedPage className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.1)_0%,_transparent_60%)]" />
      
      <div className="relative z-10 flex flex-col min-h-screen px-6 py-12 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 mb-auto"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#4f46e5] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L4 14V26L20 36L36 26V14L20 4Z" stroke="white" strokeWidth="3" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg">Nexora</span>
        </motion.div>

        <div className="flex-1 flex flex-col justify-center py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-[#1a1a25] border border-[#35354a] rounded-full px-4 py-2 w-fit mb-8"
          >
            <Sparkles className="w-4 h-4 text-[#818cf8]" />
            <span className="text-sm text-[#9ca3af] font-medium">AI-powered launch kit</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6"
          >
            Describe your business.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] to-[#6366f1]">
              AI builds your launch kit.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-[#9ca3af] leading-relaxed mb-10"
          >
            Type your idea in plain words. Nexora generates your landing page, video scripts, social captions, and business plan in seconds.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'input' })}
            className="group flex items-center justify-center gap-3 w-full bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white font-semibold text-lg py-4 px-8 rounded-2xl shadow-lg shadow-[rgba(99,102,241,0.25)] hover:shadow-[rgba(99,102,241,0.4)] transition-shadow"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'tv' })}
            className="group flex items-center justify-center gap-3 w-full bg-[#12121a] border border-[#1a1a25] text-white font-medium text-sm py-3 px-6 rounded-2xl hover:border-[#35354a] hover:bg-[#1a1a25] transition-colors mt-3"
          >
            <Tv className="w-4 h-4 text-[#818cf8]" />
            Live TV
            <span className="text-[10px] bg-[#6366f1]/20 text-[#818cf8] px-2 py-0.5 rounded-full">NEW</span>
          </motion.button>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-[#4a4a6a] mt-auto"
        >
          No credit card required
        </motion.p>
      </div>
    </AnimatedPage>
  );
}
