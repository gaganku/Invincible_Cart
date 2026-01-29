import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ setPosition, position }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  const eventHandlers = React.useMemo(
    () => ({
      dragend(e) {
        const marker = e.target;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    [setPosition],
  );

  return position === null ? null : (
    <Marker 
      draggable={true}
      eventHandlers={eventHandlers}
      position={position} 
    />
  );
};

const LocationPicker = ({ onConfirm, onCancel }) => {
  // Default to center of India
  const [center, setCenter] = useState({ lat: 20.5937, lng: 78.9629 }); 
  const [position, setPosition] = useState({ lat: 20.5937, lng: 78.9629 }); // Start with marker at center
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const newPos = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      setCenter(newPos);
      setPosition(newPos);
    }, () => {
      console.log("Geolocation blocked or failed, using default center");
    });
  }, []);

  const handleConfirm = async () => {
    console.log("📍 Confirming location:", position);
    if (!position) return;
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`;
      console.log("🌐 Fetching address from:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("📦 Geocoding response:", data);
      onConfirm(data);
    } catch (error) {
      console.error("❌ Geocoding error:", error);
      alert("Failed to get address details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-picker-overlay" onClick={(e) => e.stopPropagation()} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 10000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="location-picker-modal" style={{
        width: '90%', maxWidth: '800px', height: '80vh',
        background: '#1a1a2e', borderRadius: '15px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div className="picker-header" style={{
          padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: 'white'
        }}>
          <h3>📍 Pick Location on Map</h3>
          <button onClick={onCancel} style={{
            background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer'
          }}>×</button>
        </div>

        <div style={{ flex: 1, position: 'relative', minHeight: '400px' }}>
          <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%', minHeight: '400px' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
          
          <div style={{
            position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, background: 'rgba(0,0,0,0.7)', padding: '10px 20px', borderRadius: '20px',
            color: 'white', pointerEvents: 'none'
          }}>
            {position ? 'Tap Confirm to use this location' : 'Tap on map to select location'}
          </div>
        </div>

        <div className="picker-footer" style={{
          padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'flex-end', gap: '1rem'
        }}>
          <button onClick={onCancel} style={{
            padding: '0.8rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent', color: 'white', cursor: 'pointer'
          }}>Cancel</button>
          <button 
            onClick={handleConfirm} 
            disabled={!position || loading}
            style={{
              padding: '0.8rem 1.5rem', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', cursor: 'pointer',
              opacity: (!position || loading) ? 0.5 : 1
            }}
          >
            {loading ? 'Getting Address...' : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
