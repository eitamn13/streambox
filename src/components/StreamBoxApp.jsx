import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { registerBuiltInPlugins } from '../plugins/BuiltInPlugins.js';
import { AppProvider } from '../contexts/AppContext.jsx';
import { I18nProvider } from '../i18n/index.jsx';
import Layout from './Layout.jsx';
import Home from './Home.jsx';
import Discover from './Discover.jsx';
import Search from './Search.jsx';
import Library from './Library.jsx';
import Detail from './Detail.jsx';
import Player from './Player.jsx';
import Settings from './Settings.jsx';
import Addons from './Addons.jsx';
import Services from './Services.jsx';
import Login from '../pages/Login.jsx';
import Signup from '../pages/Signup.jsx';
import NotFound from './NotFound.jsx';

registerBuiltInPlugins();

function StreamBoxApp() {
  return (
    <AppProvider>
      <I18nProvider>
        <div className="streambox-app">
          <BrowserRouter>
            <Routes>
              <Route path="/player/:type/:id" element={<Player />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/search" element={<Search />} />
                <Route path="/library" element={<Library />} />
                <Route path="/detail/:type/:id" element={<Detail />} />
                <Route path="/addons" element={<Addons />} />
                <Route path="/services" element={<Services />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </div>
      </I18nProvider>
    </AppProvider>
  );
}

export default StreamBoxApp;
