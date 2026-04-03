import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DashboardPage() {
  const [data, setData] = useState({
    totalHouses: 0,
    visitsToday: 0,
    followUpsDue: 0,
    interestedLeads: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const today = new Date().toISOString().slice(0, 10);

        const [{ count: houseCount, error: houseError }, { count: visitCount, error: visitError }, { count: followUpCount, error: followUpError }, { count: interestedCount, error: interestedError }] =
          await Promise.all([
            supabase.from('houses').select('*', { count: 'exact', head: true }),
            supabase
              .from('visits')
              .select('*', { count: 'exact', head: true })
              .gte('visited_at', `${today}T00:00:00`)
              .lte('visited_at', `${today}T23:59:59`),
            supabase
              .from('visits')
              .select('*', { count: 'exact', head: true })
              .not('follow_up_date', 'is', null)
              .lte('follow_up_date', today),
            supabase
              .from('visits')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'Interested'),
          ]);

        const firstError =
          houseError || visitError || followUpError || interestedError;

        if (firstError) {
          throw firstError;
        }

        setData({
          totalHouses: houseCount || 0,
          visitsToday: visitCount || 0,
          followUpsDue: followUpCount || 0,
          interestedLeads: interestedCount || 0,
        });
      } catch (err) {
        setError(err.message);
      }
    }

    loadDashboard();
  }, []);

  if (error) return <div className="error-box">{error}</div>;

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
        <p>
          Your login is live. Next we’ll connect houses, visits, follow-ups, and
          leads to live Supabase data.
        </p>
      </div>
    </div>
  );
}