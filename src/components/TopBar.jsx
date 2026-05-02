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
  const { isPremium } = useSubscription();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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
    { path: '/discover', label: 'גלה' },
    { path: '/library', label: 'ספרייה' },
    { path: '/subscription', label: 'מנוי' },
  ];

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled || searchOpen ? 'bg-sb-dark/95 backdrop-blur-xl border-b border-sb-border/50' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-sb-red to-sb-red-hover rounded-lg flex items-center justify-center shadow-lg shadow-sb-red-glow">
            <Tv className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight hidden sm:block">StreamBox</span>
          {isPremium && (
            <span className="hidden sm:inline-flex items-center gap-1 bg-sb-purple text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              <Crown className="w-3 h-3" />
              פרימיום
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === link.path
                  ? 'text-white bg-white/10'
                  : 'text-sb-gray hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2 animate-fade-in">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sb-gray" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="חפש סרט, סדרה, שחקן..."
                  className="w-48 sm:w-72 bg-sb-surface border border-sb-border rounded-xl pr-9 pl-3 py-2 text-sm text-white placeholder-sb-gray focus:outline-none focus:border-sb-red/60 focus:ring-1 focus:ring-sb-red/30 transition-all"
                />
              </div>
              <button type="button" onClick={() => setSearchOpen(false)} className="p-2 text-sb-gray hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 text-sb-light hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          <Link
            to="/settings"
            className="hidden sm:flex p-2.5 text-sb-light hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
