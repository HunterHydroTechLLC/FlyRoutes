import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import MapPicker from '../components/MapPicker';

const defaultHouse = {
  address: '',
  city: '',
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
  const [success, setSuccess] = useState('');
  const [fastMode, setFastMode] = useState(true);
  const [savingQuick, setSavingQuick] = useState(false);
  const [coords, setCoords] = useState(null);
  const [geocoding, setGeocoding] = useState(false);

  async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Could not look up address from map point.');
    }

    return response.json();
  }

  async function handleMapSelect(latlng) {
    setCoords(latlng);
    setError('');
    setSuccess('');
    setGeocoding(true);

    try {
      const result = await reverseGeocode(latlng.lat, latlng.lng);
      const address = result.address || {};

      const houseNumber = address.house_number || '';
      const road =
        address.road ||
        address.residential ||
        address.pedestrian ||
        address.footway ||
        '';
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        '';
      const postcode = address.postcode || '';

      const line1 = [houseNumber, road].filter(Boolean).join(' ').trim();

      setHouseForm((prev) => ({
        ...prev,
        address: line1 || prev.address,
        city: city || prev.city,
        state: 'MI',
        zip: postcode || prev.zip,
      }));

      setSuccess('Map point selected. Address filled in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGeocoding(false);
    }
  }

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

  async function createHouseOnly(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { data, error: insertError } = await supabase
      .from('houses')
      .insert([
        {
          address: houseForm.address,
          city: houseForm.city,
          state: houseForm.state,
          zip: houseForm.zip,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null,
        },
      ])
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setHouseForm(defaultHouse);
    setCoords(null);
    setSuccess('House saved.');
    await loadHouses();
    setSelectedHouse(data);
  }

  async function logVisit(e) {
    e.preventDefault();

    if (!selectedHouse?.id) return;

    setError('');
    setSuccess('');

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
    setSuccess('Visit saved.');
    await loadHouses();
  }

  async function quickSave(statusValue, overrides = {}) {
    if (!houseForm.address.trim()) {
      setError('Tap a house on the map or enter an address first.');
      return;
    }

    setSavingQuick(true);
    setError('');
    setSuccess('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setSavingQuick(false);
      setError(userError.message);
      return;
    }

    const { data: createdHouse, error: houseError } = await supabase
      .from('houses')
      .insert([
        {
          address: houseForm.address,
          city: houseForm.city,
          state: houseForm.state,
          zip: houseForm.zip,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null,
        },
      ])
      .select()
      .single();

    if (houseError) {
      setSavingQuick(false);
      setError(houseError.message);
      return;
    }

    const visitPayload = {
      house_id: createdHouse.id,
      user_id: user?.id || null,
      status: statusValue,
      material_left: overrides.material_left ?? visitForm.material_left,
      service_type: overrides.service_type ?? visitForm.service_type,
      notes: overrides.notes ?? visitForm.notes,
      follow_up_date:
        overrides.follow_up_date ?? (visitForm.follow_up_date || null),
    };

    const { error: visitError } = await supabase
      .from('visits')
      .insert([visitPayload]);

    if (visitError) {
      setSavingQuick(false);
      setError(visitError.message);
      return;
    }

    setHouseForm(defaultHouse);
    setVisitForm(defaultVisit);
    setCoords(null);
    setSuccess(`${statusValue} saved.`);
    await loadHouses();
    setSelectedHouse(createdHouse);
    setSavingQuick(false);
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
      {success && <div className="success-box">{success}</div>}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="fast-mode-header">
          <div>
            <h3 style={{ margin: 0 }}>Fast entry mode</h3>
            <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>
              Tap the map, let it fill the address, then hit a quick action.
            </p>
          </div>

          <button
            type="button"
            className={fastMode ? '' : 'secondary'}
            onClick={() => setFastMode((v) => !v)}
          >
            {fastMode ? 'Fast mode on' : 'Fast mode off'}
          </button>
        </div>

        {fastMode && (
          <div className="fast-entry-grid">
            <div className="card soft-card">
              <h3>Quick house</h3>

              <div className="stack-form">
                <MapPicker onSelect={handleMapSelect} />

                {coords && (
                  <p style={{ marginTop: '0.5rem' }}>
                    Selected: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </p>
                )}

                {geocoding && (
                  <p style={{ marginTop: '0.25rem', color: '#475569' }}>
                    Looking up address...
                  </p>
                )}

                <input
                  placeholder="Address"
                  value={houseForm.address}
                  onChange={(e) =>
                    setHouseForm({ ...houseForm, address: e.target.value })
                  }
                />

                <div className="split-2">
                  <input
                    placeholder="City"
                    value={houseForm.city}
                    onChange={(e) =>
                      setHouseForm({ ...houseForm, city: e.target.value })
                    }
                  />

                  <input
                    placeholder="ZIP"
                    value={houseForm.zip}
                    onChange={(e) =>
                      setHouseForm({ ...houseForm, zip: e.target.value })
                    }
                  />
                </div>

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
                  placeholder="Quick notes (optional)"
                  value={visitForm.notes}
                  onChange={(e) =>
                    setVisitForm({ ...visitForm, notes: e.target.value })
                  }
                  rows={3}
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
              </div>
            </div>

            <div className="card soft-card">
              <h3>One-tap actions</h3>

              <div className="quick-action-grid">
                <button
                  type="button"
                  className="quick-action"
                  disabled={savingQuick || geocoding}
                  onClick={() =>
                    quickSave('Flyer Left', {
                      material_left: 'Partnership flyer',
                    })
                  }
                >
                  Flyer Left
                </button>

                <button
                  type="button"
                  className="quick-action"
                  disabled={savingQuick || geocoding}
                  onClick={() =>
                    quickSave('Door Hanger Left', {
                      material_left: 'Door hanger',
                    })
                  }
                >
                  Door Hanger Left
                </button>

                <button
                  type="button"
                  className="quick-action"
                  disabled={savingQuick || geocoding}
                  onClick={() =>
                    quickSave('Interested', {
                      material_left: 'Partnership flyer',
                    })
                  }
                >
                  Interested
                </button>

                <button
                  type="button"
                  className="quick-action danger"
                  disabled={savingQuick || geocoding}
                  onClick={() =>
                    quickSave('No Soliciting', {
                      material_left: 'None',
                    })
                  }
                >
                  No Soliciting
                </button>
              </div>

              <div style={{ marginTop: '0.9rem' }}>
                <button
                  type="button"
                  className="secondary"
                  disabled={savingQuick || geocoding}
                  onClick={() => {
                    setHouseForm(defaultHouse);
                    setVisitForm(defaultVisit);
                    setCoords(null);
                    setError('');
                    setSuccess('');
                  }}
                >
                  Clear form
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="two-column">
        <div>
          <div className="card">
            <h3>Add house</h3>

            <form onSubmit={createHouseOnly} className="stack-form">
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
                <p>
                  <strong>{selectedHouse.address}</strong>
                </p>
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