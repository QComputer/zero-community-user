import React, { useEffect, useRef } from 'react';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface InteractiveMapComponentProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

const InteractiveMapComponent: React.FC<InteractiveMapComponentProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const defaultCenter: LatLngExpression = [35.6892, 51.3890]; // Tehran as fallback
    const center = latitude && longitude ? [latitude, longitude] : defaultCenter;

    const map = L.map(mapRef.current).setView(center as LatLngExpression, latitude && longitude ? 15 : 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add initial marker if coordinates provided
    if (latitude && longitude) {
      const marker = L.marker([latitude, longitude]).addTo(map);
      markerRef.current = marker;
    }

    // Add click handler to select location
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      // Add new marker
      const marker = L.marker([lat, lng]).addTo(map);
      markerRef.current = marker;

      // Call the callback with new coordinates
      onLocationSelect(lat, lng);
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when coordinates change externally
  useEffect(() => {
    if (mapInstanceRef.current && latitude && longitude) {
      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Add new marker at updated position
      const marker = L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
      markerRef.current = marker;

      // Center map on new location
      mapInstanceRef.current.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude]);

  return (
    <div className="w-full rounded-lg overflow-hidden border bg-muted/20" style={{ height }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-muted-foreground">
        Click on the map to select delivery location
      </div>
    </div>
  );
};

export default InteractiveMapComponent;