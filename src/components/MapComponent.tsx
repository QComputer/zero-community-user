import React, { useEffect, useRef } from 'react';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default markers in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  latitude: number;
  longitude: number;
  userName?: string;
  showPopup?: boolean;
  height?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  latitude,
  longitude,
  userName = 'Location',
  showPopup = true,
  height = '200px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const defaultCenter: LatLngExpression = [35.6892, 51.3890]; // Tehran as fallback
    const center = latitude && longitude ? [latitude, longitude] : defaultCenter;

    const map = L.map(mapRef.current).setView(center as LatLngExpression, latitude && longitude ? 15 : 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (latitude && longitude) {
      const marker = L.marker([latitude, longitude]).addTo(map);
      if (showPopup) {
        marker.bindPopup(`
          <div style="font-family: inherit;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <strong>${userName}</strong>
            </div>
            <div style="font-size: 14px;">
              <div>Lat: ${latitude.toFixed(6)}</div>
              <div>Lng: ${longitude.toFixed(6)}</div>
            </div>
          </div>
        `).openPopup();
      }
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, userName, showPopup]);

  return (
    <div className="w-full rounded-lg overflow-hidden border" style={{ height }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }}><MapPin/></div>
    </div>
  );
};

export default MapComponent;