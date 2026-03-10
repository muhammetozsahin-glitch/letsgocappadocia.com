import LandingPage from './pages/LandingPage';
import PlannerPage from './pages/PlannerPage';
import TripDetailsPage from './pages/TripDetailsPage';
import AccountPage from './pages/AccountPage';
import ExplorePage from './pages/ExplorePage';
import LoginPage from './pages/LoginPage';
import GuidesPage from './pages/GuidesPage';
import GuideDetailPage from './pages/GuideDetailPage';
import AdminPage from './pages/AdminPage';
import type { ReactNode } from 'react';
import ToursPage from './pages/ToursPage';
import TourDetailPage from './pages/TourDetailPage';

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
  {
    name: 'Admin',
    path: '/admin',
    element: <AdminPage />
  }
];
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

export default routes;