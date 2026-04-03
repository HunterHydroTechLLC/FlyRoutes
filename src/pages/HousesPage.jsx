import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const defaultHouse = {
  address: '',
  city: 'Sterling Heights',
  state: 'MI',
  zip: '',
};

const defaultVisit = {
  status: 'Flyer Left',
  material_left: 'Partnership flyer',
  service_type: 'Both',
  notes: '',
  follow_up_date: '',
};

export default function HousesPage() {
  const [houses, setHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [houseForm, setHouseForm] = useState(defaultHouse);
  const [visitForm, setVisitForm] = useState(defaultVisit);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function loadHouses() {
    setError('');

    const { data: houseRows, error: housesError } = await supabase
      .from('houses')
      .select('*')
      .order('created_at', { ascending: false });

    if (housesError) {
      setError(housesError.message);
      return;
    }

    const safeHouses = houseRows || [];

    if (safeHouses.length === 0) {
      setHouses([]);
      setSelectedHouse(null);
      return;
    }

    const houseIds = safeHouses.map((house) => house.id);

    const { data: visitsData, error: visitsError } = await supabase
      .from('visits')
      .select('*')
      .in('house_id', houseIds)
      .order('visited_at', { ascending: false });

    if (visitsError) {
      setError(visitsError.message);
      return;
    }

    const latestByHouse = new Map();
    for (const visit of visitsData || []) {
      if (!latestByHouse.has(visit.house_id)) {
        latestByHouse.set(visit.house_id, visit);
      }
    }

    const merged = safeHouses.map((house) => {
      const latestVisit = latestByHouse.get(house.id);
      return {
        ...house,
        latest_status: latestVisit?.status || '',
        material_left: latestVisit?.material_left || '',
        service_type: latestVisit?.service_type || '',
        notes: latestVisit?.notes || '',
        follow_up_date: latestVisit?.follow_up_date || '',
      };
    });

    setHouses(merged);

    setSelectedHouse((current) => {
      if (!current) return merged[0];
      return merged.find((house) => house.id === current.id) || merged[0];
    });
  }

  useEffect(() => {
    loadHouses();
  }, []);

  const filteredHouses = useMemo(() => {
    return houses.filter((house) => {
      const haystack =
        `${house.address} ${house.city} ${house.state} ${house.zip}`.toLowerCase();

      const matchesSearch = search
        ? haystack.includes(search.toLowerCase())
        : true;

      const matchesStatus = status
        ? house.latest_status === status
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [houses, search, status]);

  async function createHouse(e) {
    e.preventDefault();
    setError('');

    const { data, error: insertError } = await supabase
      .from('houses')
      .insert([
        {
          address: houseForm.address,
          city: houseForm.city,
          state: houseForm.state,
          zip: houseForm.zip,
        },
      ])
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setHouseForm(defaultHouse);
    await loadHouses();
    setSelectedHouse(data);
  }

  async function logVisit(e) {
    e.preventDefault();

    if (!selectedHouse?.id) return;

    setError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setError(userError.message);
      return;
    }

    const { error: insertError } = await supabase.from('visits').insert([
      {
        house_id: selectedHouse.id,
        user_id: user?.id || null,
        status: visitForm.status,
        material_left: visitForm.material_left,
        service_type: visitForm.service_type,
        notes: visitForm.notes,
        follow_up_date: visitForm.follow_up_date || null,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setVisitForm(defaultVisit);
    await loadHouses();
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
              <input
                placeholder="Address"
                value={houseForm.address}
                onChange={(e) =>
                  setHouseForm({ ...houseForm, address: e.target.value })
                }
                required
              />
              <div className="split-2">
                <input
                  placeholder="City"
                  value={houseForm.city}
                  onChange={(e) =>
                    setHouseForm({ ...houseForm, city: e.target.value })
                  }
                  required
                />
                <input
                  placeholder="ZIP"
                  value={houseForm.zip}
                  onChange={(e) =>
                    setHouseForm({ ...houseForm, zip: e.target.value })
                  }
                  required
                />
              </div>
              <button type="submit">Save house</button>
            </form>
          </div>

          <div className="card">
            <h3>Search houses</h3>
            <div className="split-2">
              <input
                placeholder="Search address or city"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
          </div>

          <div className="card list-card">
            <h3>House log</h3>
            {filteredHouses.length === 0 ? (
              <p>No houses found yet.</p>
            ) : (
              filteredHouses.map((house) => (
                <button
                  key={house.id}
                  className={
                    selectedHouse?.id === house.id
                      ? 'house-row active'
                      : 'house-row'
                  }
                  onClick={() => setSelectedHouse(house)}
                >
                  <div>
                    <strong>{house.address}</strong>
                    <span>
                      {house.city}, {house.state} {house.zip}
                    </span>
                  </div>
                  <small>{house.latest_status || 'No visits yet'}</small>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Selected house</h3>
            {selectedHouse ? (
              <>
                <p><strong>{selectedHouse.address}</strong></p>
                <p>
                  {selectedHouse.city}, {selectedHouse.state} {selectedHouse.zip}
                </p>
                <p>Status: {selectedHouse.latest_status || 'No visits yet'}</p>
                <p>Material: {selectedHouse.material_left || '—'}</p>
                <p>Service: {selectedHouse.service_type || '—'}</p>
                <p>Last note: {selectedHouse.notes || '—'}</p>
              </>
            ) : (
              <p>No house selected yet.</p>
            )}
          </div>

          <div className="card">
            <h3>Log visit</h3>
            <form onSubmit={logVisit} className="stack-form">
              <select
                value={visitForm.status}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, status: e.target.value })
                }
              >
                <option>Flyer Left</option>
                <option>Door Hanger Left</option>
                <option>Spoke to Owner</option>
                <option>Interested</option>
                <option>No Soliciting</option>
                <option>Do Not Visit Again</option>
                <option>Customer</option>
              </select>

              <input
                placeholder="Material left"
                value={visitForm.material_left}
                onChange={(e) =>
                  setVisitForm({
                    ...visitForm,
                    material_left: e.target.value,
                  })
                }
              />

              <select
                value={visitForm.service_type}
                onChange={(e) =>
                  setVisitForm({
                    ...visitForm,
                    service_type: e.target.value,
                  })
                }
              >
                <option>Both</option>
                <option>Irrigation</option>
                <option>Lighting</option>
                <option>Unknown</option>
              </select>

              <textarea
                placeholder="Notes"
                value={visitForm.notes}
                onChange={(e) =>
                  setVisitForm({ ...visitForm, notes: e.target.value })
                }
                rows={5}
              />

              <input
                type="date"
                value={visitForm.follow_up_date}
                onChange={(e) =>
                  setVisitForm({
                    ...visitForm,
                    follow_up_date: e.target.value,
                  })
                }
              />

              <button type="submit" disabled={!selectedHouse}>
                Save visit log
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}