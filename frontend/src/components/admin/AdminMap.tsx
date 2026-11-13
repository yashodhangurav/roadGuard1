import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useReports } from '../../context/ReportsContext';
import { Eye, Layers, Filter } from 'lucide-react';

// Marker Pin Factory with Severity-Coded Colors
const createSeverityPin = (severity: string) => {
  let bgColor = '#10b981'; // Low
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
    className: 'admin-road-pin',
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

interface AdminMapProps {
  onSelectReport: (reportId: string) => void;
  height?: string;
}

export const AdminMap: React.FC<AdminMapProps> = ({
  onSelectReport,
  height = 'calc(100vh - 180px)',
}) => {
  const { reports } = useReports();
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (selectedSeverity !== 'All' && r.severity !== selectedSeverity) return false;
      if (selectedStatus !== 'All' && r.status !== selectedStatus) return false;
      return true;
    });
  }, [reports, selectedSeverity, selectedStatus]);

  const criticalCount = reports.filter((r) => r.severity === 'Critical').length;

  return (
    <div className="space-y-4">
      {/* Top Filter & Legend Bar */}
      <div className="p-4 rounded-2xl bg-[#111218] border border-white/10 flex flex-wrap items-center justify-between gap-4">
        {/* Severity Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-mono mr-2">
            <Filter className="w-3.5 h-3.5 text-[#d97757]" />
            <span>Severity:</span>
          </div>

          {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => {
            const isSelected = selectedSeverity === sev;
            return (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer border ${
                  isSelected
                    ? 'bg-[#d97757] border-[#d97757] text-white shadow-sm'
                    : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {sev}
              </button>
            );
          })}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#0d0e14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-neutral-300 font-mono focus:outline-none focus:border-[#d97757]"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Map Telemetry Counter */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              Pins:{' '}
              <strong className="text-white">{filtered.length}</strong>
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-red-400">
              Critical: <strong>{criticalCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Leaflet Map Frame */}
      <div
        style={{ height }}
        className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0d0e14] shadow-2xl"
      >
        <MapContainer
          center={[37.785, -122.415]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {filtered.map((report) => (
            <Marker
              key={report.id}
              position={[report.location.latitude, report.location.longitude]}
              icon={createSeverityPin(report.severity)}
            >
              <Popup className="admin-map-popup">
                <div className="p-1 min-w-[240px] text-xs">
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-200">
                    <img
                      src={report.imageUrl}
                      alt={report.category}
                      className="w-12 h-10 object-cover rounded-md bg-neutral-100 border shrink-0"
                    />
                    <div>
                      <div className="font-bold text-neutral-900 text-sm">{report.id}</div>
                      <div className="text-[11px] font-semibold text-neutral-600">
                        {report.category}
                      </div>
                    </div>
                  </div>

                  {/* Address & Severity */}
                  <div className="py-2 space-y-1.5">
                    <p className="text-[11px] text-neutral-700 leading-snug line-clamp-2">
                      {report.location.address}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-neutral-100 border text-neutral-800">
                        {report.severity}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-medium bg-neutral-100 text-neutral-700">
                        {report.status}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-2 border-t border-neutral-200">
                    <button
                      onClick={() => onSelectReport(report.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[#d97757] hover:bg-[#c66848] text-white text-xs font-semibold shadow-sm transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Report</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[400] p-3 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-xs font-mono text-neutral-300 space-y-1.5 shadow-2xl pointer-events-auto">
          <div className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider mb-1">
            Hazard Severity
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span>Critical (Immediate hazard)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d97757]" />
            <span>High (Tier 2 rehabilitation)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Medium (Scheduled patrol)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Low (Routine monitoring)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
