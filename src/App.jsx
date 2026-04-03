import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HousesPage from './pages/HousesPage';
import RoutesPage from './pages/RoutesPage';
import LeadsPage from './pages/LeadsPage';

function ProtectedRoute({ session, children }) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="card" style={{ margin: '2rem' }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute session={session}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/houses"
        element={
          <ProtectedRoute session={session}>
            <HousesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/routes"
        element={
          <ProtectedRoute session={session}>
            <RoutesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/leads"
        element={
          <ProtectedRoute session={session}>
            <LeadsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to={session ? '/' : '/login'} replace />}
      />
    </Routes>
  );
}