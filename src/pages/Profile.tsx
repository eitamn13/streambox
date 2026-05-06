import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Settings, Bell, Shield, HelpCircle, LogOut, ChevronLeft, Crown, Moon, Globe } from 'lucide-react'
import { useStore } from '../store/useStore'

interface MenuItem {
  icon: typeof Settings;
  label: string;
  value?: string;
  action?: () => void;
  danger?: boolean;
}

export default function Profile() {
  const { user, logout } = useStore()
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState('עברית')

  const menuItems: MenuItem[] = [
    { icon: Crown, label: 'מנוי פרימיום', value: user?.isPremium ? 'פעיל' : 'בסיסי' },
    { icon: Bell, label: 'התראות', value: notifications ? 'פעיל' : 'כבוי' },
    { icon: Moon, label: 'מצב לילה', value: darkMode ? 'פעיל' : 'כבוי' },
    { icon: Globe, label: 'שפה', value: language },
    { icon: Shield, label: 'פרטיות ואבטחה' },
    { icon: HelpCircle, label: 'עזרה ותמיכה' },
    { icon: Settings, label: 'הגדרות' },
    { icon: LogOut, label: 'התנתק', danger: true, action: logout },
  ]

  return (
    <div className="min-h-screen pt-16 pb-24 px-4 md:px-8 max-w-screen-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan to-electric-purple flex items-center justify-center text-2xl font-black shadow-lg">
            {(user?.name || 'איתן')[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold">{user?.name || 'איתן'}</h1>
            <p className="text-sm text-slate-secondary">{user?.email || 'user@streambox.local'}</p>
            {user?.isAdmin && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-cyan/20 text-cyan text-xs rounded-md border border-cyan/30">
                מנהל
              </span>
            )}
            {user?.isPremium && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-electric-purple/20 text-electric-purple text-xs rounded-md border border-electric-purple/30">
                פרימיום
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'סרטים שנצפו', value: '142' },
            { label: 'שעות צפייה', value: '389' },
            { label: 'ברשימה', value: '24' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-cyan">{stat.value}</p>
              <p className="text-xs text-slate-secondary mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  if (item.label === 'התראות') setNotifications(!notifications)
                  if (item.label === 'מצב לילה') setDarkMode(!darkMode)
                  if (item.label === 'שפה') setLanguage(language === 'עברית' ? 'English' : 'עברית')
                  item.action?.()
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                  item.danger
                    ? 'hover:bg-red-500/10'
                    : 'glass hover:bg-white/5'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.danger ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-slate-secondary'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className={`flex-1 text-right ${item.danger ? 'text-red-400' : ''}`}>
                  {item.label}
                </span>
                {item.value && (
                  <span className="text-sm text-slate-secondary">{item.value}</span>
                )}
                <ChevronLeft size={16} className="text-slate-secondary" />
              </motion.button>
            )
          })}
        </div>

        {/* Version */}
        <p className="text-center text-xs text-slate-secondary mt-8">StreamBox v1.0.0</p>
      </motion.div>
    </div>
  )
}
