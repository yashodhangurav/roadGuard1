import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom SVG Pin Icon for RoadGuard AI
const createRoadPinIcon = (isDraggable = true) =>
  L.divIcon({
    className: 'roadguard-map-pin',
    html: `
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; pointer-events: auto; cursor: ${isDraggable ? 'grab' : 'default'};">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(217, 119, 87, 0.35); animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 30px; height: 30px; border-radius: 9999px; background: #d97757; border: 2.5px solid #ffffff; box-shadow: 0 4px 16px rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });

interface RoadLocationMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  isInteractive?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
}

// Inner helper component to smoothly fly to new coordinates when props change
const MapRecenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], 16, { duration: 1.2 });
    }
  }, [lat, lng, map]);
  return null;
};

// Interactive Map Marker with Click-to-Move and Drag listeners
const InteractiveMarker: React.FC<{
  position: [number, number];
  address?: string;
  isInteractive: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
}> = ({ position, address, isInteractive, onPositionChange }) => {
  const pinIcon = createRoadPinIcon(isInteractive);

  useMapEvents({
    click(e) {
      if (!isInteractive) return;
      if (onPositionChange) {
        onPositionChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return (
    <Marker
      position={position}
      draggable={isInteractive}
      icon={pinIcon}
      eventHandlers={{
        dragend(e) {
          if (!isInteractive) return;
          const marker = e.target;
          const pos = marker.getLatLng();
          if (onPositionChange) {
            onPositionChange(pos.lat, pos.lng);
          }
        },
      }}
    >
      <Popup>
        <div className="text-xs p-1 min-w-[180px]">
          <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d97757]" />
            <span>Road Damage Marker</span>
          </div>
          {address && <p className="text-neutral-700 text-[11px] mt-1 leading-snug">{address}</p>}
          <div className="text-neutral-500 font-mono text-[10px] mt-1">
            {position[0].toFixed(6)}° N, {position[1].toFixed(6)}° W
          </div>
          {isInteractive && (
            <div className="text-[10px] text-amber-700 font-medium mt-1 bg-amber-50 p-1 rounded">
              Drag marker or click map to correct GPS position
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export const RoadLocationMap: React.FC<RoadLocationMapProps> = ({
  latitude,
  longitude,
  address,
  isInteractive = true,
  onLocationChange,
  height = '320px',
  className = '',
}) => {
  const position: [number, number] = [
    latitude || 37.774929,
    longitude || -122.419416,
  ];

  return (
    <div
      style={{ height }}
      className={`relative w-full rounded-xl overflow-hidden border border-white/10 bg-[#0b0c10] shadow-inner ${className}`}
    >
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={isInteractive}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapRecenter lat={position[0]} lng={position[1]} />

        <InteractiveMarker
          position={position}
          address={address}
          isInteractive={isInteractive}
          onPositionChange={onLocationChange}
        />
      </MapContainer>

      {/* Floating GPS Reticle Watermark / Instructions Overlay */}
      {isInteractive && (
        <div className="absolute top-2.5 right-2.5 z-[400] bg-black/85 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg text-[10px] font-mono text-neutral-300 pointer-events-none shadow-lg">
          CLICK OR DRAG PIN TO ADJUST GPS
        </div>
      )}
    </div>
  );
};
