import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { generateAIResponse } from '../utils/helpers'

export default function AIChat() {
  const { isAIChatOpen, toggleAIChat, aiMessages, addAIMessage } = useStore()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages, isTyping])

  useEffect(() => {
    if (isAIChatOpen) {
      inputRef.current?.focus()
    }
  }, [isAIChatOpen])

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user' as const,
      timestamp: new Date(),
    }

    addAIMessage(userMessage)
    setInput('')
    setIsTyping(true)

    // Simulate AI thinking
    setTimeout(() => {
      const response = generateAIResponse(text)
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'ai' as const,
        timestamp: new Date(),
        suggestions: response.suggestions,
      }
      addAIMessage(aiMessage)
      setIsTyping(false)
    }, 1500)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion)
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleAIChat}
        className={`fixed bottom-20 left-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isAIChatOpen
            ? 'bg-electric-orange text-white'
            : 'bg-gradient-to-br from-cyan to-electric-purple text-white neon-glow'
        }`}
      >
        {isAIChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isAIChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-36 left-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[70vh] glass-strong rounded-2xl border border-cyan/20 overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-gradient-to-r from-cyan/10 to-electric-purple/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-electric-purple flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">StreamBox AI</h3>
                <p className="text-xs text-slate-secondary flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                  </span>
                  מחובר
                </p>
              </div>
              <Sparkles size={16} className="text-cyan mr-auto" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
              {aiMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.sender === 'user'
                        ? 'bg-space-600'
                        : 'bg-gradient-to-br from-cyan to-electric-purple'
                    }`}
                  >
                    {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      msg.sender === 'user'
                        ? 'bg-cyan/20 text-white rounded-tr-sm'
                        : 'bg-white/5 text-slate-primary rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {msg.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan hover:bg-cyan/20 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-electric-purple flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="מה בא לך לראות?"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-secondary/50"
                  dir="rtl"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-lg bg-cyan flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan/90 transition-colors"
                >
                  <Send size={14} className="text-space-900" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
