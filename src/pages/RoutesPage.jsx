import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ name: '', city: '' });
  const [error, setError] = useState('');

  async function load() {
    try {
      setRoutes(await api.getRoutes());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function createRoute(e) {
    e.preventDefault();
    try {
      await api.createRoute(form);
      setForm({ name: '', city: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Routes</h2>
          <p>Create neighborhood route groups for your team.</p>
        </div>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="two-column">
        <div className="card">
          <h3>Create route</h3>
          <form onSubmit={createRoute} className="stack-form">
            <input placeholder="Route name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <button type="submit">Save route</button>
          </form>
        </div>
        <div className="card list-card">
          <h3>Saved routes</h3>
          {routes.length === 0 ? <p>No routes created yet.</p> : routes.map((route) => (
            <div key={route.id} className="simple-row">
              <div>
                <strong>{route.name}</strong>
                <span>{route.city}</span>
              </div>
              <small>{route.assigned_user_name || 'Unassigned'}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
