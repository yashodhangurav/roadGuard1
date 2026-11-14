import React, { useState, useEffect } from 'react';
import {
  Users,
  HardHat,
  Search,
  Plus,
  Filter,
  Clock,
  AlertCircle,
  Star,
  Phone,
  Mail,
  Building,
  Edit2,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  Maintainer,
  listMaintainers,
  createMaintainer,
  updateMaintainer,
  getMaintainerTasks,
} from '../../services/maintainerService';
import { useReports } from '../../context/ReportsContext';

interface MaintainersViewProps {
  onSelectReport?: (id: string) => void;
}

export const MaintainersView: React.FC<MaintainersViewProps> = ({ onSelectReport }) => {
  const { reports } = useReports();
  const [maintainers, setMaintainers] = useState<Maintainer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaintainer, setEditingMaintainer] = useState<Maintainer | null>(null);
  const [selectedMaintainerTasks, setSelectedMaintainerTasks] = useState<{
    maintainer: Maintainer;
    tasks: any[];
  } | null>(null);

  // New Maintainer Form state
  const [newForm, setNewForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Rapid Patch Division',
    password: '',
    status: 'ACTIVE',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMaintainersList = async () => {
    try {
      const data = await listMaintainers();
      setMaintainers(data);
    } catch {
      // Handled in service fallback
    }
  };

  useEffect(() => {
    fetchMaintainersList();
  }, []);

  // Compute live KPIs
  const totalMaintainers = maintainers.length;
  const activeFieldCrew = maintainers.filter((m) => m.status === 'ACTIVE').length;
  const activeAssignedReports = reports.filter(
    (r) => r.assignedMaintainerId && r.status !== 'Resolved' && r.status !== 'Rejected'
  ).length;
  const completedRepairs = reports.filter(
    (r) => r.status === 'Resolved' && (r.assignedMaintainerId || r.aiVerificationStatus === 'VERIFIED')
  ).length;

  const filteredMaintainers = maintainers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newForm.name.trim() || !newForm.email.trim()) {
      setFormError('Please provide both name and email.');
      return;
    }
    if (newForm.password && newForm.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createMaintainer({
        name: newForm.name,
        email: newForm.email,
        phone: newForm.phone,
        department: newForm.department,
        password: newForm.password || 'maintainer2026',
        status: newForm.status,
      });
      setMaintainers((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setNewForm({
        name: '',
        email: '',
        phone: '',
        department: 'Rapid Patch Division',
        password: '',
        status: 'ACTIVE',
      });
    } catch (err: any) {
      setFormError(err.message || 'Error creating maintainer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaintainer) return;
    setIsSubmitting(true);
    try {
      const updated = await updateMaintainer(editingMaintainer.id, {
        name: editingMaintainer.name,
        phone: editingMaintainer.phone,
        department: editingMaintainer.department,
        status: editingMaintainer.status,
      });
      setMaintainers((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
      );
      setEditingMaintainer(null);
    } catch (err: any) {
      alert(err.message || 'Error updating maintainer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTasksModal = async (m: Maintainer) => {
    // Collect tasks from reports context + backend
    const contextTasks = reports.filter((r) => r.assignedMaintainerId === m.id);
    try {
      const res = await getMaintainerTasks(m.id);
      const combined = res.tasks && res.tasks.length > 0 ? res.tasks : contextTasks;
      setSelectedMaintainerTasks({ maintainer: m, tasks: combined });
    } catch {
      setSelectedMaintainerTasks({ maintainer: m, tasks: contextTasks });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#d97757]/10 text-[#d97757] border border-[#d97757]/20">
              <HardHat className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Maintainer Management & Field Dispatch
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Dispatch municipal repair crews, oversee work progress, and review AI verified road remediations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMaintainersList}
            className="p-2 rounded-xl bg-[#111218] border border-white/10 hover:border-white/20 text-neutral-300 transition-colors"
            title="Refresh Maintainers"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d97757] hover:bg-[#c26244] text-white text-xs font-semibold shadow-lg shadow-[#d97757]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Maintainer</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#111218] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono">
            <span>TOTAL MAINTAINERS</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalMaintainers}</div>
          <p className="text-[11px] text-neutral-500">Registered municipal staff</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111218] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-mono">
            <span>ACTIVE FIELD CREW</span>
            <HardHat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{activeFieldCrew}</div>
          <p className="text-[11px] text-neutral-500">On-duty road technicians</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111218] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-amber-400 text-xs font-mono">
            <span>DISPATCHED TASKS</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{activeAssignedReports}</div>
          <p className="text-[11px] text-neutral-500">Repairs in progress</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#111218] border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-[#d97757] text-xs font-mono">
            <span>AI VERIFIED RESOLUTIONS</span>
            <ShieldCheck className="w-4 h-4 text-[#d97757]" />
          </div>
          <div className="text-2xl font-bold text-white">{completedRepairs}</div>
          <p className="text-[11px] text-neutral-500">Automated quality sign-offs</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#111218] border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, department, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#07080b] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d97757]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[11px] font-mono text-neutral-400">STATUS:</span>
          {(['ALL', 'ACTIVE', 'ON_LEAVE', 'INACTIVE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-[#d97757] text-white'
                  : 'bg-[#07080b] border border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Maintainers Roster Table */}
      <div className="rounded-2xl border border-white/10 bg-[#111218] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d0e14] border-b border-white/10 font-mono text-[11px] text-neutral-400 uppercase">
              <tr>
                <th className="py-3 px-4">Maintainer</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Assigned</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">Rating</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMaintainers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
                    No maintainers match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredMaintainers.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d97757] to-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{m.name}</div>
                          <div className="font-mono text-[10px] text-neutral-500">{m.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{m.department}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-400 space-y-0.5">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Mail className="w-3 h-3 text-neutral-500" />
                        <span>{m.email}</span>
                      </div>
                      {m.phone && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          <span>{m.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : m.status === 'ON_LEAVE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                        }`}
                      >
                        {m.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                      {m.assigned_tasks_count}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                      {m.completed_tasks_count}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-mono font-semibold text-white">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{m.rating.toFixed(1)}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenTasksModal(m)}
                          className="px-2.5 py-1 rounded-lg bg-[#07080b] hover:bg-white/10 border border-white/10 text-[11px] font-medium text-neutral-300 transition-colors"
                          title="View Assigned Tasks"
                        >
                          Tasks
                        </button>
                        <button
                          onClick={() => setEditingMaintainer(m)}
                          className="p-1 rounded-lg bg-[#07080b] hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors"
                          title="Edit Maintainer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD NEW MAINTAINER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#111218] border border-white/10 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardHat className="w-4 h-4 text-[#d97757]" />
                <span>Register New Road Maintainer</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mateo Rivera"
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#d97757]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  OFFICIAL EMAIL *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. mateo.rivera@roadguard.ai"
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#d97757]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    PHONE
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#d97757]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    INITIAL PASSWORD
                  </label>
                  <input
                    type="text"
                    placeholder="maintainer2026"
                    value={newForm.password}
                    onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                    className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#d97757]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  ASSIGNED DEPARTMENT
                </label>
                <select
                  value={newForm.department}
                  onChange={(e) => setNewForm({ ...newForm, department: e.target.value })}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d97757]"
                >
                  <option value="Rapid Patch Division">Rapid Patch Division</option>
                  <option value="Heavy Asphalt Works">Heavy Asphalt Works</option>
                  <option value="Arterial Corridor Maintenance">Arterial Corridor Maintenance</option>
                  <option value="Quality Assurance & Patch Inspection">QA & Patch Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  ACTIVE STATUS
                </label>
                <select
                  value={newForm.status}
                  onChange={(e) => setNewForm({ ...newForm, status: e.target.value })}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d97757]"
                >
                  <option value="ACTIVE">ACTIVE (Available for dispatch)</option>
                  <option value="ON_LEAVE">ON LEAVE (Unavailable)</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-[#d97757] hover:bg-[#c26244] text-xs font-semibold text-white transition-colors"
                >
                  {isSubmitting ? 'Registering...' : 'Register Maintainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT MAINTAINER */}
      {editingMaintainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#111218] border border-white/10 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#d97757]" />
                <span>Edit Maintainer: {editingMaintainer.name}</span>
              </h3>
              <button
                onClick={() => setEditingMaintainer(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  FULL NAME
                </label>
                <input
                  type="text"
                  required
                  value={editingMaintainer.name}
                  onChange={(e) =>
                    setEditingMaintainer({ ...editingMaintainer, name: e.target.value })
                  }
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d97757]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  PHONE
                </label>
                <input
                  type="tel"
                  value={editingMaintainer.phone || ''}
                  onChange={(e) =>
                    setEditingMaintainer({ ...editingMaintainer, phone: e.target.value })
                  }
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d97757]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  DEPARTMENT
                </label>
                <select
                  value={editingMaintainer.department}
                  onChange={(e) =>
                    setEditingMaintainer({ ...editingMaintainer, department: e.target.value })
                  }
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d97757]"
                >
                  <option value="Rapid Patch Division">Rapid Patch Division</option>
                  <option value="Heavy Asphalt Works">Heavy Asphalt Works</option>
                  <option value="Arterial Corridor Maintenance">Arterial Corridor Maintenance</option>
                  <option value="Quality Assurance & Patch Inspection">QA & Patch Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  STATUS
                </label>
                <select
                  value={editingMaintainer.status}
                  onChange={(e) =>
                    setEditingMaintainer({
                      ...editingMaintainer,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d97757]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingMaintainer(null)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-[#d97757] hover:bg-[#c26244] text-xs font-semibold text-white transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW MAINTAINER TASKS */}
      {selectedMaintainerTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#111218] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-[#d97757]" />
                  <span>Assigned Workload: {selectedMaintainerTasks.maintainer.name}</span>
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {selectedMaintainerTasks.maintainer.department} · {selectedMaintainerTasks.tasks.length} Total Task(s)
                </p>
              </div>
              <button
                onClick={() => setSelectedMaintainerTasks(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {selectedMaintainerTasks.tasks.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-xs">
                  No active tasks currently assigned to this maintainer.
                </div>
              ) : (
                selectedMaintainerTasks.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-[#07080b] border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {task.imageUrl || task.image_url ? (
                        <img
                          src={task.imageUrl || task.image_url}
                          alt="Hazard"
                          className="w-12 h-12 rounded-lg object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-500">
                          <HardHat className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">
                            {task.id}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                              task.assignmentPriority === 'CRITICAL' || task.priority === 'CRITICAL'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {task.assignmentPriority || task.priority || 'MEDIUM'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {task.location?.address || task.readable_address || 'Road Segment'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-neutral-500">
                          <span>Stage: {task.currentStage || task.current_stage || task.status}</span>
                          {task.aiVerificationStatus && (
                            <span className="text-[#d97757]">
                              · AI: {task.aiVerificationStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {onSelectReport && (
                      <button
                        onClick={() => {
                          setSelectedMaintainerTasks(null);
                          onSelectReport(task.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d97757]/10 hover:bg-[#d97757]/20 border border-[#d97757]/30 text-[#d97757] text-xs font-semibold transition-colors"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
