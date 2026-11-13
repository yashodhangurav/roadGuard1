import React, { useState } from 'react';
import {
  Bell,
  Cpu,
  Save,
  CheckCircle2,
  Building,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [departmentName, setDepartmentName] = useState('San Francisco Department of Public Works');
  const [jurisdiction, setJurisdiction] = useState('San Francisco Municipal District 1-11');
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [autoEscalateCritical, setAutoEscalateCritical] = useState(true);
  const [autoDispatchRapidPatch, setAutoDispatchRapidPatch] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-[#111218] border border-white/10 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-white">Municipal Telemetry & Authority Settings</h3>
          <p className="text-xs text-neutral-400 mt-1">
            Configure automated dispatch thresholds, computer vision tolerances, and jurisdiction protocols.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Municipal system preferences successfully committed to local storage and active dispatch nodes.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Department Info */}
        <div className="p-6 rounded-3xl bg-[#111218] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-white tracking-wider">
            <Building className="w-4 h-4 text-[#d97757]" />
            <span>Jurisdiction Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-mono">Department Name</label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full bg-[#0d0e14] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#d97757]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-mono">Territory / Districts</label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full bg-[#0d0e14] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#d97757]"
              />
            </div>
          </div>
        </div>

        {/* AI Computer Vision Tolerances */}
        <div className="p-6 rounded-3xl bg-[#111218] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-white tracking-wider">
            <Cpu className="w-4 h-4 text-[#d97757]" />
            <span>AI Computer Vision Parameters</span>
          </div>

          {/* Confidence Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-mono">Detection Confidence Gate</span>
              <span className="text-[#d97757] font-mono font-bold">{confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="1"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full accent-[#d97757] bg-white/10 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Defects with prediction confidence lower than {confidenceThreshold}% are routed for manual visual confirmation before work-order creation.
            </p>
          </div>

          {/* Automation Switches */}
          <div className="pt-3 border-t border-white/5 space-y-3">
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <div>
                <div className="font-semibold text-white">Auto-Escalate Critical Defects</div>
                <div className="text-[11px] text-neutral-500">
                  Immediately generate high-priority work order when cavity depth exceeds 75mm.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoEscalateCritical}
                onChange={(e) => setAutoEscalateCritical(e.target.checked)}
                className="w-4 h-4 rounded bg-black border-white/20 text-[#d97757] accent-[#d97757]"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <div>
                <div className="font-semibold text-white">Auto-Dispatch to Rapid Patch Division</div>
                <div className="text-[11px] text-neutral-500">
                  Automatically ping nearest asphalt patch truck crew without waiting for supervisor sign-off.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoDispatchRapidPatch}
                onChange={(e) => setAutoDispatchRapidPatch(e.target.checked)}
                className="w-4 h-4 rounded bg-black border-white/20 text-[#d97757] accent-[#d97757]"
              />
            </label>
          </div>
        </div>

        {/* Notifications & Alert Dispatch */}
        <div className="p-6 rounded-3xl bg-[#111218] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-white tracking-wider">
            <Bell className="w-4 h-4 text-[#d97757]" />
            <span>Emergency Notification Routing</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <div>
                <div className="font-semibold text-white">Administrator Email Notifications</div>
                <div className="text-[11px] text-neutral-500">
                  Dispatch daily summary and instantaneous critical alerts to admin@roadguard.ai.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded bg-black border-white/20 text-[#d97757] accent-[#d97757]"
              />
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer">
              <div>
                <div className="font-semibold text-white">SMS Pager Duty Alerts</div>
                <div className="text-[11px] text-neutral-500">
                  Send immediate SMS broadcast to on-call supervisor for highway ramp hazards.
                </div>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 rounded bg-black border-white/20 text-[#d97757] accent-[#d97757]"
              />
            </label>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#d97757] hover:bg-[#c66848] text-white text-xs font-semibold shadow-lg transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Commit Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
