import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { registerBuiltInPlugins } from '../plugins/BuiltInPlugins.js';
import { AppProvider, useApp } from '../contexts/AppContext.jsx';
import { SubscriptionProvider } from '../contexts/SubscriptionContext.jsx';
import { I18nProvider } from '../i18n/index.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import Layout from './Layout.jsx';
import Home from './Home.jsx';
import Search from './Search.jsx';
import Library from './Library.jsx';
import Detail from './Detail.jsx';
import Player from './Player.jsx';
import Settings from './Settings.jsx';
import Addons from './Addons.jsx';
import Services from './Services.jsx';
import LiveTV from './LiveTV.jsx';
import Login from '../pages/Login.jsx';
import Signup from '../pages/Signup.jsx';
import ResetPassword from '../pages/ResetPassword.jsx';
import Profile from '../pages/Profile.jsx';
import Subscription from '../pages/Subscription.jsx';
import Onboarding from './Onboarding.jsx';
import Admin from '../pages/Admin.jsx';
import NotFound from './NotFound.jsx';

registerBuiltInPlugins();

function OnboardingGuard({ children }) {
  const { onboardingDone } = useApp();
  if (!onboardingDone) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function StreamBoxApp() {
  return (
    <AppProvider>
      <SubscriptionProvider>
        <I18nProvider>
          <div className="streambox-app">
            <BrowserRouter>
              <Routes>
                <Route path="/player/:type/:id" element={<Player />} />
                <Route path="/player/:type/:id/:season/:episode" element={<Player />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route element={<Layout />}>
                  <Route path="/" element={<OnboardingGuard><Home /></OnboardingGuard>} />
                  <Route path="/search" element={<OnboardingGuard><Search /></OnboardingGuard>} />
                  <Route path="/library" element={<OnboardingGuard><Library /></OnboardingGuard>} />
                  <Route path="/detail/:type/:id" element={<OnboardingGuard><Detail /></OnboardingGuard>} />
                  <Route path="/addons" element={<OnboardingGuard><Addons /></OnboardingGuard>} />
                  <Route path="/services" element={<OnboardingGuard><Services /></OnboardingGuard>} />
                  <Route path="/settings" element={<OnboardingGuard><Settings /></OnboardingGuard>} />
                  <Route path="/live-tv" element={<OnboardingGuard><LiveTV /></OnboardingGuard>} />
                  <Route path="/profile" element={<ProtectedRoute><OnboardingGuard><Profile /></OnboardingGuard></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><OnboardingGuard><Admin /></OnboardingGuard></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </div>
        </I18nProvider>
      </SubscriptionProvider>
    </AppProvider>
  );
}

export default StreamBoxApp;
