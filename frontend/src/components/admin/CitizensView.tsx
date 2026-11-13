import React, { useState, useMemo } from 'react';
import {
  Search,
  Mail,
  Phone,
  MapPin,
  X,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { getRegisteredCitizens } from '../../services/adminService';
import { RegisteredCitizenProfile } from '../../data/adminDemoData';
import { useReports } from '../../context/ReportsContext';
import { SeverityBadge, StatusBadge } from './SeverityBadge';

interface CitizensViewProps {
  onSelectReport: (reportId: string) => void;
}

export const CitizensView: React.FC<CitizensViewProps> = ({ onSelectReport }) => {
  const citizens = getRegisteredCitizens();
  const { reports } = useReports();
  const [search, setSearch] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<RegisteredCitizenProfile | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return citizens;
    const q = search.toLowerCase();
    return citizens.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [citizens, search]);

  // Find reports filed by the selected citizen
  const citizenReports = useMemo(() => {
    if (!selectedCitizen) return [];
    return reports.filter(
      (r) =>
        r.citizenId === selectedCitizen.id ||
        r.citizenName.toLowerCase() === selectedCitizen.name.toLowerCase()
    );
  }, [reports, selectedCitizen]);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="p-5 rounded-3xl bg-[#111218] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-white">Registered Citizen Directory</h3>
          <p className="text-xs text-neutral-400 mt-1">
            Community contributors actively reporting roadway damage across municipal sectors.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search citizen by name, email..."
            className="w-full bg-[#0d0e14] border border-white/10 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-[#d97757]"
          />
        </div>
      </div>

      {/* Citizens Table */}
      <div className="rounded-2xl border border-white/10 bg-[#111218] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d0e14] border-b border-white/10 font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Citizen Profile</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Reports Filed</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((citizen) => (
                <tr key={citizen.id} className="hover:bg-white/[0.03] transition">
                  {/* Name & ID */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center font-bold text-[#d97757] text-xs">
                        {citizen.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{citizen.name}</div>
                        <div className="text-[10px] font-mono text-neutral-400">{citizen.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-neutral-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-neutral-500" />
                      <span>{citizen.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 mt-0.5">
                      <Phone className="w-3 h-3 text-neutral-500" />
                      <span>{citizen.mobile}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-neutral-300">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#d97757]" />
                      <span>{citizen.city}</span>
                    </div>
                  </td>

                  {/* Registered Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-neutral-400">
                    {citizen.registeredAt}
                  </td>

                  {/* Verification Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-950/50 border border-emerald-500/40 text-emerald-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{citizen.status}</span>
                    </span>
                  </td>

                  {/* Reports Count */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-white">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      {citizen.totalReports} reports
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedCitizen(citizen)}
                      className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#d97757]" />
                      <span>View History</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Citizen Report History Modal */}
      {selectedCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-2xl rounded-3xl bg-[#0d0e14] border border-white/10 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#d97757]/20 border border-[#d97757]/40 flex items-center justify-center font-bold text-[#d97757]">
                  {selectedCitizen.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{selectedCitizen.name}</h4>
                  <p className="text-xs text-neutral-400">
                    {selectedCitizen.email} · {selectedCitizen.city}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCitizen(null)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reports List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                Reports Submitted by this Citizen ({citizenReports.length})
              </div>

              {citizenReports.length === 0 ? (
                <div className="py-8 text-center text-neutral-500 text-xs font-mono">
                  No active reports currently logged for this profile.
                </div>
              ) : (
                citizenReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-[#111218] border border-white/5 hover:border-white/15 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={r.imageUrl}
                        alt={r.category}
                        className="w-12 h-10 object-cover rounded-lg bg-black border border-white/10 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{r.id}</span>
                          <span className="font-semibold text-neutral-300">{r.category}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate max-w-sm">
                          {r.location.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={r.severity} />
                      <StatusBadge status={r.status} />
                      <button
                        onClick={() => {
                          setSelectedCitizen(null);
                          onSelectReport(r.id);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                        title="Open Report Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/10 text-right">
              <button
                onClick={() => setSelectedCitizen(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
