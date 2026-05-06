import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, Lock, ArrowLeft, Sparkles, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function Login() {
  const { login } = useStore()
  const [mode, setMode] = useState<'select' | 'phone' | 'otp' | 'email'>('select')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneSubmit = () => {
    if (phone.length < 9) {
      setError('מספר טלפון לא תקין')
      return
    }
    setError('')
    setMode('otp')
  }

  const handleOtpSubmit = () => {
    const code = otp.join('')
    if (code.length !== 4) {
      setError('נא להזין קוד OTP מלא')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      login({
        id: 'user_' + Date.now(),
        name: 'איתן',
        phone,
        isAdmin: false,
        isPremium: true,
        favorites: [],
        watchlist: [],
        watchHistory: [],
        favoriteTeams: ['ברצלונה', 'מכבי תל אביב'],
      })
      setIsLoading(false)
    }, 1500)
  }

  const handleEmailSubmit = () => {
    if (!email || !password) {
      setError('נא למלא את כל השדות')
      return
    }

    // Admin login
    if (email === 'admin@streambox.local' && password === 'Admin123') {
      setIsLoading(true)
      setTimeout(() => {
        login({
          id: 'admin_1',
          name: 'מנהל',
          email: 'admin@streambox.local',
          isAdmin: true,
          isPremium: true,
          favorites: [],
          watchlist: [],
          watchHistory: [],
          favoriteTeams: [],
        })
        setIsLoading(false)
      }, 1000)
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      login({
        id: 'user_' + Date.now(),
        name: email.split('@')[0],
        email,
        isAdmin: false,
        isPremium: true,
        favorites: [],
        watchlist: [],
        watchHistory: [],
        favoriteTeams: [],
      })
      setIsLoading(false)
    }, 1500)
  }

  const handleGoogleSignIn = () => {
    setIsLoading(true)
    setTimeout(() => {
      login({
        id: 'google_' + Date.now(),
        name: 'איתן',
        email: 'eitan@gmail.com',
        isAdmin: false,
        isPremium: true,
        favorites: [],
        watchlist: [],
        watchHistory: [],
        favoriteTeams: ['ברצלונה'],
      })
      setIsLoading(false)
    }, 1500)
  }

  const updateOtp = (index: number, value: string) => {
    if (value.length > 1) value = value[0]
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-space-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-purple/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan to-electric-purple flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(0,212,255,0.3)]">
            <Sparkles size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-black">StreamBox</h1>
          <p className="text-sm text-slate-secondary mt-1">הדור הבא של סטרימינג</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-6 md:p-8">
          <AnimatePresence mode="wait">
            {mode === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-bold text-center mb-6">התחברות</h2>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-space-900 font-medium hover:bg-white/90 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  התחבר עם Google
                </button>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-slate-secondary">או</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                  onClick={() => { setMode('phone'); setError('') }}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl glass font-medium hover:bg-white/10 transition-colors"
                >
                  <Phone size={18} />
                  מספר טלפון + SMS
                </button>

                <button
                  onClick={() => { setMode('email'); setError('') }}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl glass font-medium hover:bg-white/10 transition-colors"
                >
                  <Mail size={18} />
                  אימייל וסיסמה
                </button>
              </motion.div>
            )}

            {mode === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setMode('select')}
                  className="flex items-center gap-1 text-slate-secondary text-sm hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} />
                  חזרה
                </button>

                <h2 className="text-lg font-bold">הזן מספר טלפון</h2>
                <p className="text-sm text-slate-secondary">נשלח לך קוד אימות ב-SMS</p>

                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-secondary">+972</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="050-000-0000"
                    className="w-full h-12 pr-20 pl-4 bg-space-800 border border-white/10 rounded-xl text-sm outline-none focus:border-cyan/50 transition-colors"
                    dir="ltr"
                  />
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button
                  onClick={handlePhoneSubmit}
                  className="w-full py-3 bg-cyan text-space-900 rounded-xl font-bold hover:bg-cyan/90 transition-colors"
                >
                  שלח קוד
                </button>
              </motion.div>
            )}

            {mode === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setMode('phone')}
                  className="flex items-center gap-1 text-slate-secondary text-sm hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} />
                  חזרה
                </button>

                <h2 className="text-lg font-bold">הזן את הקוד</h2>
                <p className="text-sm text-slate-secondary">קוד נשלח ל-{phone}</p>

                <div className="flex justify-center gap-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => updateOtp(idx, e.target.value)}
                      className="w-14 h-14 text-center text-2xl font-bold bg-space-800 border border-white/10 rounded-xl outline-none focus:border-cyan transition-colors"
                      maxLength={1}
                    />
                  ))}
                </div>

                {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                <button
                  onClick={handleOtpSubmit}
                  disabled={isLoading}
                  className="w-full py-3 bg-cyan text-space-900 rounded-xl font-bold disabled:opacity-50 hover:bg-cyan/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-space-900/30 border-t-space-900 rounded-full animate-spin" />
                  ) : (
                    'אמת קוד'
                  )}
                </button>

                <button
                  onClick={() => setMode('phone')}
                  className="w-full text-sm text-slate-secondary hover:text-white transition-colors"
                >
                  שלח קוד שוב
                </button>
              </motion.div>
            )}

            {mode === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setMode('select')}
                  className="flex items-center gap-1 text-slate-secondary text-sm hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} />
                  חזרה
                </button>

                <h2 className="text-lg font-bold">התחברות באימייל</h2>

                <div className="space-y-3">
                  <div className="relative">
                    <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-secondary" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full h-12 pr-11 pl-4 bg-space-800 border border-white/10 rounded-xl text-sm outline-none focus:border-cyan/50 transition-colors"
                      dir="ltr"
                    />
                  </div>

                  <div className="relative">
                    <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-secondary" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="סיסמה"
                      className="w-full h-12 pr-11 pl-11 bg-space-800 border border-white/10 rounded-xl text-sm outline-none focus:border-cyan/50 transition-colors"
                      dir="ltr"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-secondary"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button
                  onClick={handleEmailSubmit}
                  disabled={isLoading}
                  className="w-full py-3 bg-cyan text-space-900 rounded-xl font-bold disabled:opacity-50 hover:bg-cyan/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-space-900/30 border-t-space-900 rounded-full animate-spin" />
                  ) : (
                    'התחבר'
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-secondary mt-6">
          בהתחברות אתה מסכים לתנאי השימוש ומדיניות הפרטיות
        </p>
      </motion.div>
    </div>
  )
}
