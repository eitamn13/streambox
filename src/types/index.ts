export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  runtime?: number;
  genre_ids: number[];
  media_type: 'movie' | 'tv';
  platform?: string;
  progress?: number;
  isLive?: boolean;
  isTrending?: boolean;
  isNew?: boolean;
}

export interface TVShow extends Movie {
  name: string;
  first_air_date: string;
  episode_run_time?: number[];
  number_of_seasons?: number;
}

export interface SportEvent {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
  status: 'live' | 'upcoming' | 'finished';
  minute?: number;
  timeRemaining?: string;
  isFavorite?: boolean;
}

export interface LiveChannel {
  id: number;
  name: string;
  logo: string;
  number: number;
  currentProgram: string;
  nextProgram: string;
  isLive: boolean;
  category: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isAdmin: boolean;
  isPremium: boolean;
  favorites: number[];
  watchlist: number[];
  watchHistory: WatchHistoryItem[];
  favoriteTeams: string[];
}

export interface WatchHistoryItem {
  id: number;
  title: string;
  poster_path: string;
  progress: number;
  lastWatched: string;
  media_type: 'movie' | 'tv';
}

export interface AIMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type Page = 'home' | 'search' | 'tv' | 'sports' | 'profile';
