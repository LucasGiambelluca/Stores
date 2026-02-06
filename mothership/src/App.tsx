import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import { MainLayoutWithNav } from './components/Navbar';
import { Suspense, lazy } from 'react';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Licenses = lazy(() => import('./pages/Licenses'));
const Stores = lazy(() => import('./pages/Stores'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const LandingEditor = lazy(() => import('./pages/LandingEditor'));
const SalesPage = lazy(() => import('./pages/SalesPage').then(module => ({ default: module.SalesPage })));
const Watchdog = lazy(() => import('./pages/Watchdog'));
const PartnersPresentation = lazy(() => import('./pages/PartnersPresentation'));

// Loading skeleton component
const PageLoading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/partners-deck" element={<PartnersPresentation />} />
            
            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayoutWithNav />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/licenses" element={<Licenses />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/landing" element={<LandingEditor />} />
              <Route path="/watchdog" element={<Watchdog />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </AuthProvider>
  );
}
