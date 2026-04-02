import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HousesPage from './pages/HousesPage';
import RoutesPage from './pages/RoutesPage';
import LeadsPage from './pages/LeadsPage';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('routes_token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/houses" element={<HousesPage />} />
                <Route path="/routes" element={<RoutesPage />} />
                <Route path="/leads" element={<LeadsPage />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
