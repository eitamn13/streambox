import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Tv, Crown, User } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext.jsx';

function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef(null);
  const { isPremium, isTrialing } = useSubscription();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setQuery('');
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  const navLinks = [
    { path: '/', label: 'בית' },
    { path: '/library', label: 'מועדפים' },
    { path: '/live-tv', label: 'טלוויזיה' },
  ];

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled || searchOpen
          ? 'bg-[#0f0f1a]/95 backdrop-blur-2xl border-b border-white/5'
          : 'bg-gradient-to-b from-[#0f0f1a]/80 to-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 bg-[#e50914] rounded-lg flex items-center justify-center shadow-lg transition-shadow">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight hidden sm:block">
            Stream<span className="text-[#e50914]">Box</span>
          </span>
          {(isTrialing || isPremium) && (
            <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isTrialing ? 'bg-[#0071eb]/20 text-[#0071eb]' : 'bg-[#564d6d]/30 text-[#b3b3c0]'}`}>
              {isTrialing ? 'ניסיון' : <><Crown className="w-3 h-3" /> פרימיום</>}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === link.path
                  ? 'text-white'
                  : 'text-[#808090] hover:text-white'
              }`}
            >
              {location.pathname === link.path && (
                <span className="absolute inset-0 bg-white/10 rounded-lg" />
              )}
              <span className="relative">{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2 animate-fade-in">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808090]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="חפש סרט, סדרה, שחקן..."
                  className="w-48 sm:w-80 bg-[#1a1a2e] border border-white/10 rounded-lg pr-9 pl-3 py-2.5 text-sm text-white placeholder-[#808090] focus:outline-none focus:border-[#e50914]/60 transition-all"
                />
              </div>
              <button type="button" onClick={() => setSearchOpen(false)} className="p-2 text-[#808090] hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          <Link
            to="/settings"
            className="hidden sm:flex p-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
