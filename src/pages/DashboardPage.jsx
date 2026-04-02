import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <div className="card">Loading dashboard...</div>;

  const cards = [
    ['Total houses', data.totalHouses],
    ['Visits today', data.visitsToday],
    ['Follow-ups due', data.followUpsDue],
    ['Interested leads', data.interestedLeads],
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Quick view of today’s route and lead activity.</p>
        </div>
      </div>
      <div className="stats-grid">
        {cards.map(([label, value]) => (
          <div key={label} className="card stat-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Next build step</h3>
        <p>This MVP is ready for your real data. Once it’s installed, we can add map pins, GPS logging, and photo uploads.</p>
      </div>
    </div>
  );
}
