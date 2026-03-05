import LandingPage from './pages/LandingPage';
import PlannerPage from './pages/PlannerPage';
import TripDetailsPage from './pages/TripDetailsPage';
import AccountPage from './pages/AccountPage';
import ExplorePage from './pages/ExplorePage';
import LoginPage from './pages/LoginPage';
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
  }
];

export default routes;
