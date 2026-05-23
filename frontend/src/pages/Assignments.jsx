import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Search, Layers, UserCog, Mail, Phone, Users, CheckCircle, AlertTriangle, ShieldCheck, ArrowRight, Sliders, Check, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const Assignments = () => {
  const { user } = useContext(AuthContext);

  if (user?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  const [employees, setEmployees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search input for main grid
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');

  // Modal Assignment States
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assignedGroupIds, setAssignedGroupIds] = useState([]);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAllocationsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both staff and groups concurrently
      const [resStaff, resGroups] = await Promise.all([
        api.get('/auth'),
        api.get('/groups')
      ]);

      // Filter to only include Employee role for collection assignments
      const employeeList = resStaff.data.filter(u => u.role === 'Employee');
      setEmployees(employeeList);
      setGroups(resGroups.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch allocation records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocationsData();
  }, []);

  const handleOpenAssignModal = (employee) => {
    setSelectedEmployee(employee);
    setModalSearchQuery('');
    
    // Extract groups currently assigned to this collector
    const initiallyAssigned = groups
      .filter(g => g.collector && (g.collector._id === employee._id || g.collector === employee._id))
      .map(g => g._id);
      
    setAssignedGroupIds(initiallyAssigned);
    setShowModal(true);
  };

  const handleToggleGroup = (groupId) => {
    if (assignedGroupIds.includes(groupId)) {
      setAssignedGroupIds(assignedGroupIds.filter(id => id !== groupId));
    } else {
      setAssignedGroupIds([...assignedGroupIds, groupId]);
    }
  };

  const handleSaveAssignments = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setSaving(true);
    try {
      await api.put('/auth/assign-groups', {
        employeeId: selectedEmployee._id,
        groupIds: assignedGroupIds
      });

      setShowModal(false);
      alert(`Collection rosters for ${selectedEmployee.name} updated successfully!`);
      fetchAllocationsData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  // Math Statistics
  const totalGroups = groups.length;
  const assignedGroups = groups.filter(g => g.collector).length;
  const unassignedGroups = totalGroups - assignedGroups;
  const activeCollectors = employees.length;

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
    emp.username?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Collector Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">Review and delegate microfinance collection rosters to active employees</p>
        </div>
      </div>

      {/* Statistics Cards (Redesigned with glowing borders and premium highlights) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Total Groups */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl border border-violet-100 shadow-xs">
            <Layers size={20} />
          </div>
          <div className="text-left">
            <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Total Groups</p>
            <h3 className="text-xl font-black text-slate-850 mt-0.5">{totalGroups}</h3>
          </div>
        </div>

        {/* Stat 2: Assigned Groups */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-xs">
            <CheckCircle size={20} />
          </div>
          <div className="text-left">
            <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Assigned Roster</p>
            <h3 className="text-xl font-black text-slate-850 mt-0.5">{assignedGroups}</h3>
          </div>
        </div>

        {/* Stat 3: Unassigned Groups */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className={`p-3 rounded-xl border shadow-xs ${unassignedGroups > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="text-left">
            <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Unassigned Roster</p>
            <h3 className={`text-xl font-black mt-0.5 ${unassignedGroups > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {unassignedGroups}
            </h3>
          </div>
        </div>

        {/* Stat 4: Active Collectors */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-xs">
            <Users size={20} />
          </div>
          <div className="text-left">
            <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Active Collectors</p>
            <h3 className="text-xl font-black text-slate-850 mt-0.5">{activeCollectors}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search collectors by name or username..."
              value={searchEmployeeQuery}
              onChange={(e) => setSearchEmployeeQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-350 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-xs font-semibold bg-white text-slate-800"
            />
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-semibold animate-pulse">
            Syncing collector allocations ledger...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 font-bold bg-rose-50/50 rounded-2xl m-6 border border-rose-100">
            Error: {error}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold bg-white italic">
            No active collector accounts found. Please register employee accounts to assign rosters.
          </div>
        ) : (
          /* Cards Grid */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((emp) => {
              const empGroups = groups.filter(
                (g) => g.collector && (g.collector._id === emp._id || g.collector === emp._id)
              );

              return (
                <div 
                  key={emp._id} 
                  className="bg-white border border-slate-100 hover:border-violet-200 rounded-2xl shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden relative group"
                >
                  {/* Subtle top indicator bar */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-violet-500 group-hover:bg-violet-600 transition"></div>

                  <div className="p-5 space-y-4 flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-black text-sm border border-violet-100">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="text-left">
                        <h4 className="font-extrabold text-slate-850 text-sm leading-snug">{emp.name}</h4>
                        <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-650 text-[9px] font-bold uppercase tracking-wider mt-1">
                          @{emp.username}
                        </span>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 text-xs text-slate-650 border-t border-b border-slate-50 py-3 text-left">
                      <p className="flex items-center gap-2">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span>{emp.phone || 'N/A'}</span>
                      </p>
                    </div>

                    {/* Roster Section */}
                    <div className="space-y-2 text-left">
                      <p className="text-[9px] text-slate-450 font-black uppercase tracking-widest">
                        Delegated Groups ({empGroups.length})
                      </p>
                      {empGroups.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                          {empGroups.map((g) => (
                            <span 
                              key={g._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-violet-50 text-violet-750 border border-violet-100 shadow-sm"
                            >
                              <Layers size={10} className="shrink-0" />
                              {g.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 font-medium italic">
                          No collection groups assigned
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleOpenAssignModal(emp)}
                      className="w-full bg-white hover:bg-violet-50 border border-slate-250 text-slate-700 hover:text-violet-750 px-4 py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition uppercase tracking-wider cursor-pointer"
                    >
                      <Sliders size={12} />
                      <span>Manage Roster</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Roster Management Overlay Modal */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="text-left">
                <h2 className="text-base font-black text-slate-800 tracking-tight">Configure Roster</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-semibold">Configure JLG rosters managed by <strong className="text-violet-600">{selectedEmployee.name}</strong></p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search microfinance groups..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-350 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-xs font-semibold bg-white text-slate-850"
                />
              </div>

              <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 bg-slate-50 max-h-64 overflow-y-auto text-left shadow-xs">
                {groups
                  .filter((group) => group.name?.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                  .map((group) => {
                    const isChecked = assignedGroupIds.includes(group._id);
                    const currentCollector = group.collector;
                    
                    let collectorText = 'Unassigned';
                    let badgeColor = 'text-slate-450 bg-slate-100 border-slate-200 border';
                    
                    if (currentCollector) {
                      if (currentCollector._id === selectedEmployee._id || currentCollector === selectedEmployee._id) {
                        collectorText = 'Assigned to them';
                        badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-100 border';
                      } else {
                        collectorText = `Managed by ${currentCollector.name || 'other'}`;
                        badgeColor = 'text-amber-700 bg-amber-50 border-amber-100 border';
                      }
                    }

                    return (
                      <div
                        key={group._id}
                        onClick={() => handleToggleGroup(group._id)}
                        className={`flex items-center justify-between p-3.5 cursor-pointer transition ${
                          isChecked ? 'bg-violet-50/40 hover:bg-violet-50/60' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1 text-left">
                          <p className="text-xs font-extrabold text-slate-850">{group.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold">
                              {group.members?.length || 0} Members
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeColor}`}>
                              {collectorText}
                            </span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-350 bg-white'
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                {groups.filter((group) => group.name?.toLowerCase().includes(modalSearchQuery.toLowerCase())).length === 0 && (
                  <p className="p-4 text-center text-slate-400 text-xs italic font-semibold bg-white">No groups found.</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-1/2 bg-white text-slate-700 border border-slate-250 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                disabled={saving}
                className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider cursor-pointer shadow-xs shadow-violet-500/10 disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
