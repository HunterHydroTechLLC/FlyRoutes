import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLeads() {
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select(`
          id,
          status,
          service_type,
          follow_up_date,
          visited_at,
          house_id,
          houses (
            address,
            city,
            state,
            zip
          )
        `)
        .order('visited_at', { ascending: false });

      if (visitsError) {
        setError(visitsError.message);
        return;
      }

      const filtered = (visits || []).filter(
        (lead) => lead.status === 'Interested' || !!lead.follow_up_date
      );

      setLeads(filtered);
    }

    loadLeads();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Leads</h2>
          <p>Houses that need follow-up or already showed interest.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card list-card">
        {leads.length === 0 ? (
          <p>No leads yet.</p>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="simple-row bordered">
              <div>
                <strong>{lead.houses?.address || 'Unknown address'}</strong>
                <span>
                  {lead.houses?.city || ''}, {lead.houses?.state || ''} {lead.houses?.zip || ''}
                </span>
                <span>
                  {lead.status} • {lead.service_type || 'Unknown'}
                </span>
              </div>
              <small>{lead.follow_up_date || 'No follow-up date'}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}