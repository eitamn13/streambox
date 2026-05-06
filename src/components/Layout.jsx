import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar.jsx';
import BottomNav from './BottomNav.jsx';

function Layout() {
  const location = useLocation();
  const isPlayer = location.pathname.startsWith('/player');

  if (isPlayer) return <Outlet />;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0f]">
      <TopBar />
      <main className="flex-1 pt-16 pb-20 md:pb-0 page-transition">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export default Layout;
