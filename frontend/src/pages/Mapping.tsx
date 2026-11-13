import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Navigation,
  Search,
  X,
  Compass,
} from 'lucide-react';
import { useReports, RoadDamageReport } from '../context/ReportsContext';
import { EASE_SWIFT } from '../styles/motion';

// Pin Factory with Severity-Coded Styling
const createSeverityPin = (severity: string) => {
  let bgColor = '#10b981';
  let pingColor = 'rgba(16, 185, 129, 0.4)';
  let isPulsing = false;

  if (severity === 'Critical') {
    bgColor = '#ef4444';
    pingColor = 'rgba(239, 68, 68, 0.55)';
    isPulsing = true;
  } else if (severity === 'High') {
    bgColor = '#d97757';
    pingColor = 'rgba(217, 119, 87, 0.45)';
    isPulsing = true;
  } else if (severity === 'Medium') {
    bgColor = '#f59e0b';
    pingColor = 'rgba(245, 158, 11, 0.4)';
  }

  return L.divIcon({
    className: 'roadguard-pin',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        ${
          isPulsing
            ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: ${pingColor}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
        }
        <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background: ${bgColor}; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

const UserLocationMarker: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(coords, 15, { duration: 1.2 });
  }, [coords, map]);

  const userIcon = L.divIcon({
    className: 'user-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(59, 130, 246, 0.5); animation: ping 1.5s infinite;"></div>
        <div style="position: relative; width: 22px; height: 22px; border-radius: 9999px; background: #3b82f6; border: 3px solid #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.5);"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <Marker position={coords} icon={userIcon}>
      <Popup className="dark-popup">
        <div className="p-1 font-mono text-xs text-white">Your Current GPS Location</div>
      </Popup>
    </Marker>
  );
};

export const Mapping: React.FC = () => {
  const { reports } = useReports();
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeReport, setActiveReport] = useState<RoadDamageReport | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (selectedSeverity !== 'All' && report.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'All' && report.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesAddress = report.location.address.toLowerCase().includes(query);
        const matchesCat = report.category.toLowerCase().includes(query);
        const matchesId = report.id.toLowerCase().includes(query);
        if (!matchesAddress && !matchesCat && !matchesId) return false;
      }
      return true;
    });
  }, [reports, selectedSeverity, selectedCategory, searchQuery]);

  // Handle Current Location Detection
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback to San Francisco default center with gentle feedback
        setUserLocation([37.7749, -122.4194]);
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const defaultCenter: [number, number] = [37.7749, -122.4194];

  return (
    <div className="py-10 md:py-14">
      <div className="wrap">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/40 bg-blue-500/10 text-xs font-mono text-blue-400 mb-3 shadow-sm">
              <Compass className="w-3.5 h-3.5" />
              <span>Geospatial Infrastructure Telemetry</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-white mb-2">
              Geographical Road Damage Map
            </h1>
            <p className="text-sm sm:text-base text-text-2 max-w-2xl">
              Inspect active road hazards across city corridors. Verified severity ratings, exact GPS coordinates, and real-time defect updates.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 font-mono text-xs shrink-0">
            <div className="px-3 py-2 rounded-xl border border-line bg-surface/80 backdrop-blur-md">
              <span className="text-text-3">Monitored Hazards: </span>
              <span className="font-bold text-white">{filteredReports.length}</span>
            </div>
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber/40 bg-amber/15 hover:bg-amber/25 text-amber text-xs font-mono font-semibold transition cursor-pointer"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Locate Me'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-6 p-4 rounded-2xl border border-line-2 bg-gradient-to-b from-[#13141d]/90 to-[#0e0f14]/90 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by address, street, or defect ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-line text-xs text-text placeholder-text-3 focus:outline-none focus:border-amber transition"
            />
          </div>

          {/* Severity Filters */}
          <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto">
            <span className="text-text-4 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Severity:
            </span>
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                  selectedSeverity === sev
                    ? 'bg-amber text-white font-semibold shadow-sm'
                    : 'bg-white/[0.04] text-text-3 hover:text-white border border-line'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-text-4">Type:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-surface border border-line text-xs text-text focus:outline-none focus:border-amber cursor-pointer"
            >
              <option value="All">All Defects</option>
              <option value="Pothole">Potholes</option>
              <option value="Surface Deterioration">Surface Deterioration</option>
              <option value="Alligator Crack">Alligator Cracks</option>
              <option value="Longitudinal Crack">Longitudinal Cracks</option>
            </select>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-[640px] rounded-2xl border border-line-2 overflow-hidden shadow-2xl">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', background: '#090a0f' }}
            className="dark-tiles z-0"
          >
            {/* Clean OpenStreetMap Tiles with Dark Night Pavement Styling */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            {/* Optional User GPS Location Marker */}
            {userLocation && <UserLocationMarker coords={userLocation} />}

            {/* Road Damage Markers */}
            {filteredReports.map((report) => (
              <Marker
                key={report.id}
                position={[report.location.latitude, report.location.longitude]}
                icon={createSeverityPin(report.severity)}
                eventHandlers={{
                  click: () => setActiveReport(report),
                }}
              >
                <Popup className="dark-popup">
                  <div className="p-2 space-y-2 max-w-[240px] text-xs font-mono">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                      <span className="font-bold text-white">{report.id}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          report.severity === 'Critical'
                            ? 'bg-red-500/20 text-red-400'
                            : report.severity === 'High'
                            ? 'bg-amber/20 text-amber'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {report.severity}
                      </span>
                    </div>

                    <div className="text-[11px] font-sans text-neutral-300 font-medium">
                      {report.category}
                    </div>

                    <div className="text-[10px] text-neutral-400 truncate">
                      {report.location.address}
                    </div>

                    <button
                      onClick={() => setActiveReport(report)}
                      className="w-full mt-2 py-1 bg-amber hover:bg-[#c66848] text-white text-[11px] font-semibold rounded transition"
                    >
                      View Report Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Overlay Badge */}
          <div className="absolute top-4 left-4 z-[400] px-3 py-1.5 rounded-xl bg-surface/90 border border-line-2 backdrop-blur-md text-xs font-mono text-text flex items-center gap-2 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Geospatial Ingestion Active</span>
          </div>

          {/* Inspector Slide-Over Panel */}
          <AnimatePresence>
            {activeReport && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: EASE_SWIFT }}
                className="absolute top-4 right-4 bottom-4 w-full max-w-sm z-[400] rounded-2xl border border-line-2 bg-[#12131b]/95 backdrop-blur-2xl p-5 shadow-2xl flex flex-col justify-between overflow-y-auto"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-line">
                    <div>
                      <div className="text-xs font-mono text-amber">{activeReport.id}</div>
                      <h3 className="text-base font-semibold text-white tracking-tight">
                        {activeReport.category}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveReport(null)}
                      className="w-7 h-7 rounded-full bg-surface-2 border border-line flex items-center justify-center text-text-2 hover:text-white transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="mt-4 rounded-xl overflow-hidden border border-line relative aspect-video bg-black/40">
                    <img
                      src={activeReport.imageUrl}
                      alt={activeReport.category}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/samples/road-pothole-1.jpg';
                      }}
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-amber border border-white/10">
                      AI Verified
                    </span>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-3 font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-line">
                      <div className="text-text-4 text-[10px] uppercase">Location</div>
                      <div className="text-neutral-200 mt-0.5 font-sans text-xs">
                        {activeReport.location.address}
                      </div>
                      <div className="text-[10px] text-text-4 mt-1">
                        GPS: {activeReport.location.latitude.toFixed(6)},{' '}
                        {activeReport.location.longitude.toFixed(6)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-line">
                        <div className="text-text-4 text-[10px] uppercase">Severity</div>
                        <div
                          className={`font-bold mt-0.5 ${
                            activeReport.severity === 'Critical'
                              ? 'text-red-400'
                              : activeReport.severity === 'High'
                              ? 'text-amber'
                              : 'text-emerald-400'
                          }`}
                        >
                          {activeReport.severity}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-line">
                        <div className="text-text-4 text-[10px] uppercase">Status</div>
                        <div className="font-bold text-white mt-0.5">
                          {activeReport.status}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-line font-sans text-xs text-text-2 leading-relaxed">
                      <div className="text-text-4 font-mono text-[10px] uppercase mb-1">
                        Field Description
                      </div>
                      {activeReport.description}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-line text-xs font-mono text-text-3 flex items-center justify-between">
                  <span>Logged: {activeReport.submittedAt}</span>
                  <span className="text-emerald-400">DPW Sync</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Mapping;
