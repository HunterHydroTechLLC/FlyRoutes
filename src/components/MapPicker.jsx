import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function getMarkerIcon(status) {
  if (status === 'Interested') return greenIcon;
  if (status === 'No Soliciting') return redIcon;
  if (status === 'Door Hanger Left') return goldIcon;
  return defaultIcon;
}

function ClickMarker({ onSelectNewPoint }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onSelectNewPoint(e.latlng);
    },
  });

  return position ? (
    <Marker position={position} icon={defaultIcon}>
      <Popup>New point selected</Popup>
    </Marker>
  ) : null;
}

export default function MapPicker({
  onSelectNewPoint,
  savedHouses = [],
  onSelectSavedHouse,
}) {
  const [center, setCenter] = useState([42.5803, -83.0302]);
  const mapKey = useMemo(() => `${center[0]}-${center[1]}`, [center]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        console.log('GPS denied or unavailable');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  const mappedHouses = savedHouses.filter(
    (house) =>
      typeof house.latitude === 'number' &&
      typeof house.longitude === 'number'
  );

  return (
    <div
      style={{
        marginTop: '1rem',
        height: '360px',
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #cbd5e1',
      }}
    >
      <MapContainer
        key={mapKey}
        center={center}
        zoom={19}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickMarker onSelectNewPoint={onSelectNewPoint} />

        {mappedHouses.map((house) => (
          <Marker
            key={house.id}
            position={[house.latitude, house.longitude]}
            icon={getMarkerIcon(house.latest_status)}
            eventHandlers={{
              click: () => onSelectSavedHouse?.(house),
            }}
          >
            <Popup>
              <div>
                <strong>{house.address}</strong>
                <br />
                <span>
                  {house.city}, {house.state} {house.zip}
                </span>
                <br />
                <span>{house.latest_status || 'No visits yet'}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}