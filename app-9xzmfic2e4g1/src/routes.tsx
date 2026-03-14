// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/routes.tsx (TÜM ROTALAR - GÜNCEL)
// ═══════════════════════════════════════════════════════════════════════════════

import LandingPage from './pages/LandingPage';
import PlannerPage from './pages/PlannerPage';
import TripDetailsPage from './pages/TripDetailsPage';
import TripPreviewPage from './pages/TripPreviewPage';
import AccountPage from './pages/AccountPage';
import ExplorePage from './pages/ExplorePage';
import LoginPage from './pages/LoginPage';
import GuidesPage from './pages/GuidesPage';
import GuideDetailPage from './pages/GuideDetailPage';
// Balon Sayfaları
import BalloonsPage from './pages/BalloonsPage';
import BalloonDetailPage from './pages/BalloonDetailPage';
// Admin Sayfaları
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminToursPage from './pages/admin/AdminToursPage';
import AdminTourForm from './pages/admin/AdminTourForm';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <LandingPage />
  },
  // ═══ BALON ═══
  {
    name: 'Balloons',
    path: '/balon',
    element: <BalloonsPage />
  },
  {
    name: 'Balloon Detail',
    path: '/balon/:slug',
    element: <BalloonDetailPage />
  },
  // ═══ AI PLANNER ═══
  {
    name: 'Planner',
    path: '/planner',
    element: <PlannerPage />
  },
  {
    name: 'Trip Details',
    path: '/trip/:id',
    element: <TripDetailsPage />
  },
  {
    name: 'Trip Preview',
    path: '/trip/preview',
    element: <TripPreviewPage />
  },
  // ═══ KULLANICI ═══
  {
    name: 'My Account',
    path: '/account',
    element: <AccountPage />
  },
  {
    name: 'Explore',
    path: '/explore',
    element: <ExplorePage />
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />
  },
  {
    name: 'Guides',
    path: '/rehberler',
    element: <GuidesPage />
  },
  {
    name: 'Guide Detail',
    path: '/rehber/:id',
    element: <GuideDetailPage />
  },
  // ═══ ADMİN ═══
  {
    name: 'Admin',
    path: '/admin',
    element: <AdminDashboard />
  },
  {
    name: 'Admin Tours',
    path: '/admin/turlar',
    element: <AdminToursPage />
  },
  {
    name: 'Admin Tour New',
    path: '/admin/turlar/yeni',
    element: <AdminTourForm />
  },
  {
    name: 'Admin Tour Edit',
    path: '/admin/turlar/:id',
    element: <AdminTourForm />
  }
];

export default routes;
