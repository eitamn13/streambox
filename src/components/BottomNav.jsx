import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Tv, Heart, User } from 'lucide-react';

function BottomNav() {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'בית', icon: Home },
    { path: '/search', label: 'חיפוש', icon: Search },
    { path: '/live-tv', label: 'טלוויזיה', icon: Tv },
    { path: '/library', label: 'מועדפים', icon: Heart },
    { path: '/settings', label: 'פרופיל', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 right-0 left-0 z-50 glass border-t border-white/5 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? 'text-[#e50914]' : 'text-[#808090]'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
