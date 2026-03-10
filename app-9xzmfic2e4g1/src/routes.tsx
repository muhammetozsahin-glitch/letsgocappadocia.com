// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/routes.tsx (TÜM ROTALAR)
// ═══════════════════════════════════════════════════════════════════════════════

import LandingPage from './pages/LandingPage';
import PlannerPage from './pages/PlannerPage';
import TripDetailsPage from './pages/TripDetailsPage';
import AccountPage from './pages/AccountPage';
import ExplorePage from './pages/ExplorePage';
import LoginPage from './pages/LoginPage';
import GuidesPage from './pages/GuidesPage';
import GuideDetailPage from './pages/GuideDetailPage';
// Yeni Sayfalar
import ToursPage from './pages/ToursPage';
import TourDetailPage from './pages/TourDetailPage';
import BalloonsPage from './pages/BalloonsPage';
import ActivitiesPage from './pages/ActivitiesPage';
// Admin Sayfaları
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminToursPage from './pages/admin/AdminToursPage';
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
  // ═══ TURLAR ═══
  {
    name: 'Tours',
    path: '/turlar',
    element: <ToursPage />
  },
  {
    name: 'Tour Detail',
    path: '/tur/:slug',
    element: <TourDetailPage />
  },
  // ═══ BALON ═══
  {
    name: 'Balloons',
    path: '/balon',
    element: <BalloonsPage />
  },
  // ═══ AKTİVİTELER ═══
  {
    name: 'Activities',
    path: '/aktiviteler',
    element: <ActivitiesPage />
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
  }
];

export default routes;