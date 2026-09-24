import React, { useEffect, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Circle, 
  Marker, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { X, Check, MapPin, Sliders, Shield } from 'lucide-react';

// Custom Map Marker Icon fix for Leaflet in Vite
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function SafeZoneMapModal({ initialData, onSave, onClose }) {
  // Default to initial location or Pune (18.5204, 73.8567)
  const defaultLat = initialData?.latitude || 18.5204;
  const defaultLng = initialData?.longitude || 73.8567;
  
  const [position, setPosition] = useState([defaultLat, defaultLng]);
  const [zoneName, setZoneName] = useState(initialData?.zoneName || '');
  const [radius, setRadius] = useState(initialData?.radius || 1000);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.classList.add('safe-zone-editor-open');
    return () => document.body.classList.remove('safe-zone-editor-open');
  }, []);

  const handleSave = () => {
    if (!zoneName.trim()) {
      setError('Please enter a zone name (e.g. Home, College)');
      return;
    }
    if (!position || position.length !== 2) {
      setError('Please tap/click on the map to set a center location.');
      return;
    }
    onSave({
      zoneName: zoneName.trim(),
      latitude: position[0],
      longitude: position[1],
      radius: Number(radius)
    });
  };

  return (
    <div className="safe-zone-map-modal fixed inset-0 z-50 flex items-center justify-center bg-[#fff9fb]/96 p-2 backdrop-blur-md sm:p-4">
      <div className="relative flex h-[92dvh] max-h-[920px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white/95 shadow-[0_28px_90px_rgba(92,48,70,0.20)] sm:rounded-3xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF5F8A]/10 text-[#FF5F8A]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {initialData ? 'Edit Safe Zone' : 'Configure New Safe Zone'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Tap map to reposition, drag slider to adjust boundary
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Zone Name
            </label>
            <div className="relative">
              <input 
                type="text"
                value={zoneName}
                onChange={(e) => {
                  setZoneName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. College Campus, Home, Office"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm text-slate-900 placeholder-slate-400"
              />
              <MapPin className="w-4 h-4 text-[#FF5F8A] absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-500" />
                Boundary Radius
              </label>
              <span className="text-sm font-bold text-[#FF5F8A]">
                {Math.round(radius)} meters
              </span>
            </div>
            <input 
              type="range" 
              min="100"
              max="5000"
              step="50"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF5F8A] mt-2"
            />
          </div>
        </div>

        {error && (
          <div className="px-4 sm:px-6 py-2 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Leaflet Interactive Map View */}
        <div className="relative min-h-[240px] w-full flex-1 sm:min-h-[300px] lg:min-h-0">
          <MapContainer
            center={position}
            zoom={14}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
            className="dark-tiles z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={(pos) => setPosition(pos)} />
            
            {position && (
              <>
                <Marker position={position} icon={customMarkerIcon} />
                <Circle
                  center={position}
                  radius={radius}
                  pathOptions={{
                    color: '#FF5F8A',
                    fillColor: '#FF5F8A',
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                />
              </>
            )}
          </MapContainer>

          <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md border border-slate-200 text-xs text-slate-700 shadow-sm">
            Coordinates: <span className="font-mono text-slate-900 font-bold">{position[0].toFixed(4)}, {position[1].toFixed(4)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 bg-slate-50/80">
          <button 
            onClick={onClose}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#FF5F8A] to-[#D63162] hover:opacity-90 shadow-lg shadow-[#FF5F8A]/25 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save Safe Zone</span>
          </button>
        </div>

      </div>
    </div>
  );
}
