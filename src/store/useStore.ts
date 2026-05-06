import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AIMessage, Page, Movie } from '../types'

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  showOnboarding: boolean;
  login: (user: User) => void;
  logout: () => void;
  completeOnboarding: () => void;

  // Navigation
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  // Player
  isPlayerOpen: boolean;
  currentMedia: Movie | null;
  openPlayer: (media: Movie) => void;
  closePlayer: () => void;

  // AI Assistant
  isAIChatOpen: boolean;
  aiMessages: AIMessage[];
  toggleAIChat: () => void;
  addAIMessage: (message: AIMessage) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // UI
  isScrolled: boolean;
  setIsScrolled: (scrolled: boolean) => void;
}

const defaultMessages: AIMessage[] = [
  {
    id: '1',
    text: 'היי! אני העוזר החכם של StreamBox. מה בא לך לראות היום? 🎬',
    sender: 'ai',
    timestamp: new Date(),
    suggestions: ['בא לי משהו מטורף', 'סדרה ממכרת', 'סרט אקשן טוב', 'מה חם עכשיו']
  }
]

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      showOnboarding: true,
      currentPage: 'home',
      isPlayerOpen: false,
      currentMedia: null,
      isAIChatOpen: false,
      aiMessages: defaultMessages,
      searchQuery: '',
      isScrolled: false,

      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      completeOnboarding: () => set({ showOnboarding: false }),
      setCurrentPage: (page) => set({ currentPage: page }),
      openPlayer: (media) => set({ isPlayerOpen: true, currentMedia: media }),
      closePlayer: () => set({ isPlayerOpen: false, currentMedia: null }),
      toggleAIChat: () => set((state) => ({ isAIChatOpen: !state.isAIChatOpen })),
      addAIMessage: (message) => set((state) => ({ aiMessages: [...state.aiMessages, message] })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setIsScrolled: (scrolled) => set({ isScrolled: scrolled }),
    }),
    {
      name: 'streambox-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        showOnboarding: state.showOnboarding,
        aiMessages: state.aiMessages,
      }),
    }
  )
)
