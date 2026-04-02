import { useEffect, useState } from 'react';
import { api } from '../services/api';

const defaultHouse = { address: '', city: 'Sterling Heights', state: 'MI', zip: '' };
const defaultVisit = { status: 'Flyer Left', material_left: 'Partnership flyer', service_type: 'Both', notes: '', follow_up_date: '' };

export default function HousesPage() {
  const [houses, setHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [houseForm, setHouseForm] = useState(defaultHouse);
  const [visitForm, setVisitForm] = useState(defaultVisit);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function loadHouses() {
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (status) params.set('status', status);
      const data = await api.getHouses(params.toString());
      setHouses(data);
      if (!selectedHouse && data.length) setSelectedHouse(data[0]);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadHouses();
  }, []);

  async function createHouse(e) {
    e.preventDefault();
    try {
      const house = await api.createHouse(houseForm);
      setHouseForm(defaultHouse);
      await loadHouses();
      setSelectedHouse(house);
    } catch (err) {
      setError(err.message);
    }
  }

  async function logVisit(e) {
    e.preventDefault();
    if (!selectedHouse?.id) return;
    try {
      await api.createVisit({ ...visitForm, house_id: selectedHouse.id, follow_up_date: visitForm.follow_up_date || null });
      setVisitForm(defaultVisit);
      await loadHouses();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Houses</h2>
          <p>Add homes, search neighborhoods, and log flyer drops.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="two-column">
        <div>
          <div className="card">
            <h3>Add house</h3>
            <form onSubmit={createHouse} className="stack-form">
              <input placeholder="Address" value={houseForm.address} onChange={(e) => setHouseForm({ ...houseForm, address: e.target.value })} required />
              <div className="split-2">
                <input placeholder="City" value={houseForm.city} onChange={(e) => setHouseForm({ ...houseForm, city: e.target.value })} required />
                <input placeholder="ZIP" value={houseForm.zip} onChange={(e) => setHouseForm({ ...houseForm, zip: e.target.value })} required />
              </div>
              <button type="submit">Save house</button>
            </form>
          </div>

          <div className="card">
            <h3>Search houses</h3>
            <div className="split-2">
              <input placeholder="Search address or city" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option>Flyer Left</option>
                <option>Door Hanger Left</option>
                <option>Spoke to Owner</option>
                <option>Interested</option>
                <option>No Soliciting</option>
                <option>Customer</option>
              </select>
            </div>
            <button onClick={loadHouses}>Apply filters</button>
          </div>

          <div className="card list-card">
            <h3>House log</h3>
            {houses.map((house) => (
              <button key={house.id} className={selectedHouse?.id === house.id ? 'house-row active' : 'house-row'} onClick={() => setSelectedHouse(house)}>
                <div>
                  <strong>{house.address}</strong>
                  <span>{house.city}, {house.state} {house.zip}</span>
                </div>
                <small>{house.latest_status || 'No visits yet'}</small>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Selected house</h3>
            {selectedHouse ? (
              <>
                <p><strong>{selectedHouse.address}</strong></p>
                <p>{selectedHouse.city}, {selectedHouse.state} {selectedHouse.zip}</p>
                <p>Status: {selectedHouse.latest_status || 'No visits yet'}</p>
                <p>Material: {selectedHouse.material_left || '—'}</p>
                <p>Service: {selectedHouse.service_type || '—'}</p>
                <p>Last note: {selectedHouse.notes || '—'}</p>
              </>
            ) : <p>No house selected yet.</p>}
          </div>

          <div className="card">
            <h3>Log visit</h3>
            <form onSubmit={logVisit} className="stack-form">
              <select value={visitForm.status} onChange={(e) => setVisitForm({ ...visitForm, status: e.target.value })}>
                <option>Flyer Left</option>
                <option>Door Hanger Left</option>
                <option>Spoke to Owner</option>
                <option>Interested</option>
                <option>No Soliciting</option>
                <option>Do Not Visit Again</option>
                <option>Customer</option>
              </select>
              <input placeholder="Material left" value={visitForm.material_left} onChange={(e) => setVisitForm({ ...visitForm, material_left: e.target.value })} />
              <select value={visitForm.service_type} onChange={(e) => setVisitForm({ ...visitForm, service_type: e.target.value })}>
                <option>Both</option>
                <option>Irrigation</option>
                <option>Lighting</option>
                <option>Unknown</option>
              </select>
              <textarea placeholder="Notes" value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} rows={5} />
              <input type="date" value={visitForm.follow_up_date} onChange={(e) => setVisitForm({ ...visitForm, follow_up_date: e.target.value })} />
              <button type="submit" disabled={!selectedHouse}>Save visit log</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
