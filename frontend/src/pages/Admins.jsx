import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Search, UserCog, Trash2, Layers, X, Mail, Phone, ShieldAlert, Award, Camera, Calendar, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

// Image compression helper
const compressImage = (file, maxWidth = 400, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const Admins = () => {
  const { user } = useContext(AuthContext);

  if (user?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  const [admins, setAdmins] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Add staff modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'Admin',
  });

  // Edit staff modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'Admin',
    employeeId: '',
    profilePhoto: '',
  });

  // Assign groups modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assignedGroupIds, setAssignedGroupIds] = useState([]);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);

  // Role update modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedStaffForRole, setSelectedStaffForRole] = useState(null);
  const [newRole, setNewRole] = useState('Admin');
  const [savingRole, setSavingRole] = useState(false);

  const fetchAdminsAndGroups = async () => {
    try {
      setLoading(true);
      const resStaff = await api.get('/auth');
      setAdmins(resStaff.data);

      const resGroups = await api.get('/groups');
      setGroups(resGroups.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminsAndGroups();
  }, [user.token]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', username: '', password: '', role: 'Admin' });
      fetchAdminsAndGroups();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleRowClick = (admin) => {
    setSelectedStaffForEdit(admin);
    setEditFormData({
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      username: admin.username || '',
      password: '',
      role: admin.role || 'Admin',
      employeeId: admin.employeeId || '',
      profilePhoto: admin.profilePhoto || '',
    });
    setShowEditModal(true);
  };

  const handleEditImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setEditFormData({ ...editFormData, profilePhoto: base64 });
    } catch (err) {
      console.error('Error compressing profile photo:', err);
      alert('Failed to process image file. Please try another one.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editFormData };
      if (!payload.password) {
        delete payload.password;
      }
      await api.put(`/auth/staff/${selectedStaffForEdit._id}`, payload);
      setShowEditModal(false);
      alert('Staff profile updated successfully!');
      fetchAdminsAndGroups();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    
    try {
      await api.delete(`/auth/${id}`);
      fetchAdminsAndGroups();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Assign groups handlers
  const handleOpenAssignGroups = (employee) => {
    setSelectedEmployee(employee);
    setAssignSearchQuery('');
    // Extract groups currently assigned to this employee
    const initiallyAssigned = groups
      .filter((g) => g.collector && (g.collector._id === employee._id || g.collector === employee._id))
      .map((g) => g._id);
    setAssignedGroupIds(initiallyAssigned);
    setShowAssignModal(true);
  };

  const handleToggleGroupAssignment = (groupId) => {
    if (assignedGroupIds.includes(groupId)) {
      setAssignedGroupIds(assignedGroupIds.filter((id) => id !== groupId));
    } else {
      setAssignedGroupIds([...assignedGroupIds, groupId]);
    }
  };

  const handleSaveAssignments = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setSavingAssign(true);
    try {
      await api.put('/auth/assign-groups', {
        employeeId: selectedEmployee._id,
        groupIds: assignedGroupIds,
      });

      setShowAssignModal(false);
      alert('Group assignments updated successfully!');
      fetchAdminsAndGroups();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSavingAssign(false);
    }
  };

  // Role update handlers
  const handleOpenRoleModal = (staff) => {
    setSelectedStaffForRole(staff);
    setNewRole(staff.role);
    setShowRoleModal(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!selectedStaffForRole) return;

    // Safety check: Cannot demote yourself
    if (selectedStaffForRole._id === user._id && newRole !== 'Admin') {
      alert('You cannot change your own admin role. Please ask another administrator.');
      return;
    }

    setSavingRole(true);
    try {
      await api.put(`/auth/${selectedStaffForRole._id}/role`, { role: newRole });

      setShowRoleModal(false);
      alert('User role updated successfully!');
      fetchAdminsAndGroups();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSavingRole(false);
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage system administrators, operator accounts, and collector privileges</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition font-bold text-xs shadow-md shadow-violet-500/15 cursor-pointer uppercase tracking-wider shrink-0"
        >
          <Plus size={16} />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Main Table Directory */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar Search */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search staff accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="premium-input pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Name / ID</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Access Level</th>
                <th className="px-6 py-4">Assigned Roster</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium italic animate-pulse">
                    Syncing operations staff registry...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium italic bg-white">
                    No active staff accounts found matching your query.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const adminGroups = groups.filter(
                    (g) => g.collector && (g.collector._id === admin._id || g.collector === admin._id)
                  );
                  
                  return (
                    <tr
                      key={admin._id}
                      onClick={() => handleRowClick(admin)}
                      className="hover:bg-slate-50/60 transition cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-violet-100 text-violet-700 flex items-center justify-center font-black text-xs shrink-0 border border-slate-100 shadow-inner">
                            {admin.profilePhoto ? (
                              <img src={admin.profilePhoto} alt={admin.name} className="w-full h-full object-cover" />
                            ) : (
                              admin.name ? admin.name.charAt(0).toUpperCase() : 'A'
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-extrabold text-slate-850 text-xs">{admin.name}</p>
                            <p className="font-mono text-[9px] text-slate-400 font-bold mt-0.5">{admin.employeeId || 'No ID'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-left text-xs font-semibold text-slate-700 space-y-0.5">
                          <p className="flex items-center gap-1">
                            <Mail size={12} className="text-slate-400" /> {admin.email}
                          </p>
                          {admin.phone && (
                            <p className="flex items-center gap-1">
                              <Phone size={12} className="text-slate-400" /> {admin.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold">
                          @{admin.username}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenRoleModal(admin); }}
                          className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-violet-50 text-violet-750 border border-violet-100 hover:bg-violet-100 hover:text-violet-900 hover:border-violet-200 px-2.5 py-1 rounded-full cursor-pointer transition"
                          title="Change Access Level Role"
                        >
                          <UserCog size={12} className="shrink-0" />
                          <span>{admin.role}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {admin.role === 'Employee' ? (
                          adminGroups.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {adminGroups.map((g) => (
                                <span
                                  key={g._id}
                                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                                >
                                  {g.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic font-medium">No assigned groups</span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {admin.role === 'Employee' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenAssignGroups(admin); }}
                              className="text-violet-700 hover:bg-violet-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-violet-100 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer uppercase tracking-wider shadow-xs"
                              title="Assign Collection Groups"
                            >
                              <Layers size={12} />
                              <span>Assign Roster</span>
                            </button>
                          )}
                          {user._id !== admin._id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(admin._id); }}
                              className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition border border-transparent hover:border-rose-100 cursor-pointer"
                              title="Remove Staff Account"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="text-left">
                <h2 className="text-base font-black text-slate-800 tracking-tight">Add Staff Account</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-semibold">Create a system operator credential profile</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="premium-input"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="premium-input"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mobile Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="premium-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="premium-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Access Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="premium-select"
                >
                  <option value="Admin">System Admin</option>
                  <option value="Employee">Field Collector</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6 bg-slate-50 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 bg-white text-slate-700 border border-slate-250 py-2 rounded-xl font-bold hover:bg-slate-50 transition text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2 rounded-xl font-bold transition text-xs uppercase tracking-wider cursor-pointer shadow-xs shadow-violet-500/10"
                >
                  Save Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Groups Modal */}
      {showAssignModal && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="text-left">
                <h2 className="text-base font-black text-slate-800 tracking-tight">Assign Collection Roster</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-semibold">Configure JLG rosters managed by <strong className="text-violet-600">{selectedEmployee.name}</strong></p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
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
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="premium-input pl-10"
                />
              </div>

              <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 bg-slate-50 max-h-64 overflow-y-auto text-left shadow-xs">
                {groups
                  .filter((group) => group.name?.toLowerCase().includes(assignSearchQuery.toLowerCase()))
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
                        onClick={() => handleToggleGroupAssignment(group._id)}
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
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Done by parent div click
                          className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-slate-350 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                {groups.filter((group) => group.name?.toLowerCase().includes(assignSearchQuery.toLowerCase())).length === 0 && (
                  <p className="p-4 text-center text-slate-400 text-xs italic font-semibold bg-white">No groups matched your query.</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="w-1/2 bg-white text-slate-700 border border-slate-250 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                disabled={savingAssign}
                className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider cursor-pointer shadow-xs shadow-violet-500/10 disabled:opacity-50"
              >
                {savingAssign ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Role Modal */}
      {showRoleModal && selectedStaffForRole && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-left">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black text-slate-800 tracking-tight">Configure User Access</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveRole} className="p-6 space-y-4">
              <div className="text-xs text-slate-600 space-y-2 text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-semibold">
                <p>Change system access authorization for <strong>{selectedStaffForRole.name}</strong> (username: <code>{selectedStaffForRole.username}</code>).</p>
                {selectedStaffForRole._id === user._id && (
                  <p className="text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-[10px] font-bold flex items-start gap-1">
                    <span>⚠️</span>
                    <span>Caution: You are changing your own authority role. Take extreme care to prevent lockouts!</span>
                  </p>
                )}
                {newRole === 'Admin' && selectedStaffForRole.role === 'Employee' && (
                  <p className="text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-[10px] font-bold flex items-start gap-1">
                    <span>⚠️</span>
                    <span>Note: Promoting this account to Admin will automatically release any operations collection groups currently delegated to them.</span>
                  </p>
                )}
              </div>
              
              <div className="text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Access Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  required
                  className="premium-select"
                >
                  <option value="Admin">System Admin</option>
                  <option value="Employee">Field Collector</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6 bg-slate-50 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="w-1/2 bg-white text-slate-700 border border-slate-250 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRole}
                  className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider cursor-pointer shadow-xs shadow-violet-500/10 disabled:opacity-50"
                >
                  {savingRole ? 'Saving...' : 'Update Authority'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Staff Modal */}
      {showEditModal && selectedStaffForEdit && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="text-left">
                <h2 className="text-base font-black text-slate-800 tracking-tight">Edit Staff Profile</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-semibold">Modify particulars for <strong className="text-violet-600">{selectedStaffForEdit.name}</strong></p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-left">
              {/* Profile Photo */}
              <div className="flex flex-col items-center justify-center pb-2 border-b border-slate-50">
                <div className="relative group">
                  <div className="p-1 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 shadow-md">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-inner bg-slate-100 flex items-center justify-center">
                      {editFormData.profilePhoto ? (
                        <img src={editFormData.profilePhoto} alt="Upload Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <User size={32} />
                        </div>
                      )}
                      <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white/90 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={18} />
                        <span className="text-[8px] font-black uppercase mt-1 tracking-wider">Change</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleEditImageChange} 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="premium-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                  className="premium-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    required
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={editFormData.employeeId}
                    onChange={(e) => setEditFormData({ ...editFormData, employeeId: e.target.value })}
                    placeholder="Auto-generated if blank"
                    className="premium-input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Access Role *</label>
                  <select
                    name="role"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    required
                    className="premium-select"
                  >
                    <option value="Admin">System Admin</option>
                    <option value="Employee">Field Collector</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Reset Password (leave blank to keep)</label>
                  <input
                    type="password"
                    name="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="New password"
                    className="premium-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Joining Date</label>
                <div className="premium-input bg-slate-50 text-slate-500 border-slate-100 flex items-center gap-2 cursor-not-allowed select-none font-semibold">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <span>
                    {new Date(selectedStaffForEdit.createdAt).toLocaleString('en-US', { 
                      weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6 bg-slate-50 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-1/2 bg-white text-slate-700 border border-slate-250 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider cursor-pointer shadow-xs shadow-violet-500/10"
                >
                  Save Profile Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;
