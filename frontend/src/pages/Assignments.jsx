import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Search, Layers, UserCog, Mail, Phone, Users, CheckCircle, AlertTriangle, ShieldCheck, ArrowRight, Sliders, Check } from 'lucide-react';
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Collector Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">Review and delegate Joint Liability Group collection rosters to active employees</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Total Groups */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Groups</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalGroups}</h3>
          </div>
        </div>

        {/* Stat 2: Assigned Groups */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Assigned Roster</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{assignedGroups}</h3>
          </div>
        </div>

        {/* Stat 3: Unassigned Groups */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex items-center gap-4">
          <div className={`p-3.5 rounded-xl ${unassignedGroups > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Unassigned Groups</p>
            <h3 className={`text-2xl font-extrabold mt-1 ${unassignedGroups > 0 ? 'text-amber-600 font-black' : 'text-slate-700'}`}>
              {unassignedGroups}
            </h3>
          </div>
        </div>

        {/* Stat 4: Active Collectors */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Collectors</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{activeCollectors}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search collectors by name or username..."
              value={searchEmployeeQuery}
              onChange={(e) => setSearchEmployeeQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-250 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-slate-800 font-medium"
            />
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="text-center py-16 text-slate-500 font-semibold animate-pulse">
            Fetching employee collection sheets...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 font-semibold bg-red-50/50 rounded-xl m-6 border border-red-100">
            Error: {error}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-semibold">
            No collector accounts found. Please verify you have registered employees.
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
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden relative group"
                >
                  {/* Decorative tag */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500 group-hover:bg-indigo-600 transition"></div>

                  <div className="p-5 space-y-4 flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="text-left">
                        <h4 className="font-extrabold text-slate-800 text-base leading-snug">{emp.name}</h4>
                        <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                          @{emp.username}
                        </span>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 text-xs text-slate-500 font-semibold border-t border-b border-slate-100 py-3 text-left">
                      <p className="flex items-center gap-2">
                        <Mail size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span>{emp.phone || 'N/A'}</span>
                      </p>
                    </div>

                    {/* Roster Section */}
                    <div className="space-y-2 text-left">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Assigned Roster ({empGroups.length})
                      </p>
                      {empGroups.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                          {empGroups.map((g) => (
                            <span 
                              key={g._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm"
                            >
                              <Layers size={10} className="shrink-0" />
                              {g.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400 font-medium italic">
                          No collection groups assigned
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-150 flex gap-2">
                    <button
                      onClick={() => handleOpenAssignModal(emp)}
                      className="w-full bg-white hover:bg-indigo-50 border border-slate-250 text-slate-700 hover:text-indigo-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <Sliders size={13} />
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
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Manage Roster</h2>
                <p className="text-xs text-slate-500 mt-1">Configure groups for collector: <strong className="text-indigo-600">{selectedEmployee.name}</strong></p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-white border border-slate-200 rounded-lg p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search microfinance groups..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-slate-800"
                />
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50 overflow-y-auto max-h-64 border-collapse">
                {groups
                  .filter((group) => group.name?.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                  .map((group) => {
                    const isChecked = assignedGroupIds.includes(group._id);
                    const currentCollector = group.collector;
                    
                    let collectorText = 'Unassigned';
                    let badgeColor = 'text-slate-400 bg-slate-100 border-slate-200 border';
                    
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
                        className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50/50 hover:bg-indigo-50/70' : 'bg-white hover:bg-slate-55'
                        }`}
                      >
                        <div className="space-y-1 text-left">
                          <p className="text-sm font-bold text-slate-800">{group.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-bold">
                              {group.members?.length || 0} Members
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${badgeColor}`}>
                              {collectorText}
                            </span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-350 bg-white'
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                {groups.filter((group) => group.name?.toLowerCase().includes(modalSearchQuery.toLowerCase())).length === 0 && (
                  <p className="p-4 text-center text-slate-500 text-sm font-semibold bg-white italic">No groups found.</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-150 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm shadow-blue-500/30 font-semibold text-sm disabled:opacity-50"
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
