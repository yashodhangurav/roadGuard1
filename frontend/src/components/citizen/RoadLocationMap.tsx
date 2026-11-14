import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NearbyReport } from '../../services/detectionApi';

// Custom SVG Pin Icon for Current Incident Position
const createRoadPinIcon = (isDraggable = true) =>
  L.divIcon({
    className: 'roadguard-map-pin',
    html: `
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; pointer-events: auto; cursor: ${isDraggable ? 'grab' : 'default'};">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(217, 119, 87, 0.4); animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
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

// Custom Icon for Nearby Existing Reports
const createNearbyPinIcon = (severity: string) => {
  const color =
    severity === 'Critical'
      ? '#ef4444'
      : severity === 'High'
      ? '#f59e0b'
      : '#3b82f6';

  return L.divIcon({
    className: 'roadguard-nearby-pin',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="position: relative; width: 24px; height: 24px; border-radius: 9999px; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

interface RoadLocationMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  isInteractive?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
  gpsAccuracy?: number | null;
  searchRadiusMeters?: number;
  showSearchRadius?: boolean;
  nearbyReports?: NearbyReport[];
  onSelectNearbyReport?: (report: NearbyReport) => void;
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
  accuracy?: number | null;
  onPositionChange?: (lat: number, lng: number) => void;
}> = ({ position, address, isInteractive, accuracy, onPositionChange }) => {
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
        <div className="text-xs p-1 min-w-[190px]">
          <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d97757]" />
            <span>Target Road Damage Location</span>
          </div>
          {address && <p className="text-neutral-700 text-[11px] mt-1 leading-snug">{address}</p>}
          <div className="text-neutral-500 font-mono text-[10px] mt-1">
            {position[0].toFixed(6)}° N, {position[1].toFixed(6)}° W
          </div>
          {accuracy && (
            <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
              GPS Accuracy: ±{accuracy}m
            </div>
          )}
          {isInteractive && (
            <div className="text-[10px] text-amber-800 font-medium mt-1 bg-amber-50 p-1 rounded border border-amber-200">
              Drag marker or click map to adjust GPS position
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
  gpsAccuracy = null,
  searchRadiusMeters = 50,
  showSearchRadius = true,
  nearbyReports = [],
  onSelectNearbyReport,
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

        {/* 50m Configurable Search Radius Circle */}
        {showSearchRadius && searchRadiusMeters && searchRadiusMeters > 0 && (
          <Circle
            center={position}
            radius={searchRadiusMeters}
            pathOptions={{
              color: '#d97757',
              fillColor: '#d97757',
              fillOpacity: 0.1,
              weight: 1.5,
              dashArray: '5, 5',
            }}
          />
        )}

        {/* GPS Accuracy Circle (Green if high accuracy, Amber if moderate, Red if low) */}
        {gpsAccuracy && gpsAccuracy > 0 && (
          <Circle
            center={position}
            radius={gpsAccuracy}
            pathOptions={{
              color: gpsAccuracy <= 15 ? '#10b981' : gpsAccuracy <= 50 ? '#f59e0b' : '#ef4444',
              fillColor: gpsAccuracy <= 15 ? '#10b981' : gpsAccuracy <= 50 ? '#f59e0b' : '#ef4444',
              fillOpacity: 0.08,
              weight: 1.2,
            }}
          />
        )}

        {/* Main Incident Target Pin */}
        <InteractiveMarker
          position={position}
          address={address}
          accuracy={gpsAccuracy}
          isInteractive={isInteractive}
          onPositionChange={onLocationChange}
        />

        {/* Nearby Existing Reports Markers */}
        {nearbyReports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createNearbyPinIcon(report.severity)}
            eventHandlers={{
              click: () => {
                if (onSelectNearbyReport) onSelectNearbyReport(report);
              },
            }}
          >
            <Popup>
              <div className="text-xs p-1.5 min-w-[200px]">
                <div className="flex items-center justify-between gap-2 border-b border-neutral-200 pb-1 mb-1">
                  <span className="font-bold text-neutral-900">{report.category}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      report.severity === 'Critical'
                        ? 'bg-red-100 text-red-700'
                        : report.severity === 'High'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {report.severity}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-700 mb-1">
                  <strong>Distance:</strong> {report.distance_meters}m away
                </div>
                {report.address && (
                  <div className="text-[10px] text-neutral-600 line-clamp-2 mb-1">
                    {report.address}
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-100">
                  <span>Status: {report.status}</span>
                  <span className="font-mono">{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating GPS Reticle Watermark / Instructions Overlay */}
      {isInteractive && (
        <div className="absolute top-2.5 right-2.5 z-[400] bg-black/85 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg text-[10px] font-mono text-neutral-300 pointer-events-none shadow-lg flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97757] animate-pulse" />
          <span>CLICK OR DRAG PIN TO ADJUST GPS</span>
        </div>
      )}

      {/* Radius & Accuracy Legend Pill in bottom left */}
      <div className="absolute bottom-2.5 left-2.5 z-[400] bg-black/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg text-[10px] font-mono text-neutral-400 pointer-events-none flex items-center gap-2">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full border border-dashed border-[#d97757] bg-[#d97757]/20" />
          <span>{searchRadiusMeters}m search zone</span>
        </span>
        {nearbyReports.length > 0 && (
          <span className="text-amber-400 font-semibold border-l border-white/20 pl-2">
            {nearbyReports.length} nearby issue{nearbyReports.length === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  );
};

