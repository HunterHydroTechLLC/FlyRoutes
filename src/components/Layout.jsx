import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Layout({ children }) {
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
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
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>Logged in</strong>
          <span>Supabase Auth</span>
          <button className="secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}