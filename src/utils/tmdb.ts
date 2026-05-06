const API_KEY = '6b994c1f88925c366e6016c4505d81c8'
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const tmdbImage = (path: string | null, size: string = 'w500') => {
  if (!path) return 'https://via.placeholder.com/500x750/111936/00d4ff?text=No+Image'
  return `${IMAGE_BASE}/${size}${path}`
}

export const tmdbBackdrop = (path: string | null, size: string = 'original') => {
  if (!path) return 'https://via.placeholder.com/1280x720/111936/00d4ff?text=No+Image'
  return `${IMAGE_BASE}/${size}${path}`
}

interface FetchOptions {
  language?: string
  page?: number
  [key: string]: string | number | undefined
}

async function fetchTMDB(endpoint: string, options: FetchOptions = {}) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    language: options.language || 'he-IL',
    ...Object.entries(options).reduce((acc, [key, val]) => {
      if (val !== undefined) acc[key] = String(val)
      return acc
    }, {} as Record<string, string>),
  })

  const url = `${BASE_URL}${endpoint}?${params}`
  
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('TMDB fetch error:', error)
    return null
  }
}

export const tmdb = {
  trending: (timeWindow: 'day' | 'week' = 'week') => 
    fetchTMDB(`/trending/all/${timeWindow}`),
  
  popularMovies: (page = 1) => 
    fetchTMDB('/movie/popular', { page }),
  
  popularTV: (page = 1) => 
    fetchTMDB('/tv/popular', { page }),
  
  topRated: (page = 1) => 
    fetchTMDB('/movie/top_rated', { page }),
  
  upcoming: (page = 1) => 
    fetchTMDB('/movie/upcoming', { page }),
  
  movieDetails: (id: number) => 
    fetchTMDB(`/movie/${id}`, { append_to_response: 'credits,videos' }),
  
  tvDetails: (id: number) => 
    fetchTMDB(`/tv/${id}`, { append_to_response: 'credits,videos' }),
  
  search: (query: string, page = 1) => 
    fetchTMDB('/search/multi', { query, page }),
  
  discover: (options: FetchOptions = {}) => 
    fetchTMDB('/discover/movie', options),
  
  genreList: () => 
    fetchTMDB('/genre/movie/list'),
}
