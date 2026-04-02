import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getLeads().then(setLeads).catch((err) => setError(err.message));
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
        {leads.length === 0 ? <p>No leads yet.</p> : leads.map((lead, index) => (
          <div key={`${lead.address}-${index}`} className="simple-row bordered">
            <div>
              <strong>{lead.address}</strong>
              <span>{lead.city}, {lead.state} {lead.zip}</span>
              <span>{lead.status} • {lead.service_type || 'Unknown'}</span>
            </div>
            <small>{lead.follow_up_date || 'No follow-up date'}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
