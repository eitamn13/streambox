import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Search, Library, Zap } from 'lucide-react';

function BottomNav() {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'בית', icon: Home },
    { path: '/discover', label: 'גלה', icon: Compass },
    { path: '/search', label: 'חיפוש', icon: Search },
    { path: '/library', label: 'ספרייה', icon: Library },
    { path: '/services', label: 'Debrid', icon: Zap },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 right-0 left-0 z-50 glass border-t border-sb-border/50 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? 'text-sb-red' : 'text-sb-gray'
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
