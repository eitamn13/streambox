import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tv as TvIcon, Radio, Play, Clock } from 'lucide-react'
import { liveChannels } from '../data/mockData'

export default function TV() {
  const [selectedCategory, setSelectedCategory] = useState('הכל')
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null)

  const categories = ['הכל', 'חדשות', 'בידור', 'ספורט', 'ילדים']
  const filteredChannels = selectedCategory === 'הכל'
    ? liveChannels
    : liveChannels.filter((c) => c.category === selectedCategory)

  return (
    <div className="min-h-screen pt-16 pb-24 px-4 md:px-8 max-w-screen-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TvIcon size={24} className="text-cyan" />
          טלוויזיה חיה
        </h1>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan text-space-900'
                  : 'glass hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured channel (if selected) */}
        {selectedChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-2xl overflow-hidden glass-card"
          >
            <div className="aspect-video bg-space-800 flex items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-cyan/20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <Play size={32} className="text-cyan ml-1" fill="currentColor" />
                </div>
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-xs font-bold">שידור חי</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold">{liveChannels.find((c) => c.id === selectedChannel)?.name}</h3>
              <p className="text-sm text-slate-secondary">
                עכשיו משודר: {liveChannels.find((c) => c.id === selectedChannel)?.currentProgram}
              </p>
            </div>
          </motion.div>
        )}

        {/* Channel grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChannels.map((channel, idx) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedChannel(channel.id)}
              className={`glass-card rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] ${
                selectedChannel === channel.id ? 'ring-2 ring-cyan' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  <Radio size={28} className="text-space-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate">{channel.name}</h3>
                    {channel.isLive && (
                      <span className="relative flex h-2 w-2 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cyan font-medium mt-0.5">עכשיו: {channel.currentProgram}</p>
                  <div className="flex items-center gap-1 mt-1 text-slate-secondary">
                    <Clock size={10} />
                    <span className="text-xs">הבא: {channel.nextProgram}</span>
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-secondary/30">
                  {channel.number}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
