import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('routes_user') || 'null');

  function logout() {
    localStorage.removeItem('routes_token');
    localStorage.removeItem('routes_user');
    navigate('/login');
  }

  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/houses', label: 'Houses' },
    { to: '/routes', label: 'Routes' },
    { to: '/leads', label: 'Leads' },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h1>Routes</h1>
          <p>Hunter HydroTech</p>
        </div>
        <nav>
          {links.map((link) => (
            <Link key={link.to} className={location.pathname === link.to ? 'nav-link active' : 'nav-link'} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <strong>{user?.name || 'User'}</strong>
          <span>{user?.role || 'admin'}</span>
          <button className="secondary" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
