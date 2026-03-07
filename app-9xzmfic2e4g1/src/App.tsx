import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { SiteSettingsProvider } from '@/hooks/use-site-settings';
import { RouteGuard } from '@/components/common/RouteGuard';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Navbar } from '@/components/layout/Navbar';
import { AnnouncementBanner } from '@/components/layout/AnnouncementBanner';
import routes from './routes';
import { Toaster } from '@/components/ui/sonner';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SiteSettingsProvider>
          <BrowserRouter>
            <AnnouncementBanner />
            <Navbar />
            <RouteGuard>
              <Routes>
                {routes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={route.element}
                  />
                ))}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </RouteGuard>
            <Toaster position="top-center" />
          </BrowserRouter>
        </SiteSettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;