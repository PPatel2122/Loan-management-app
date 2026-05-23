import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Search, UserCog, Trash2, Layers } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

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

  // Add/Edit staff modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'Admin',
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
      const resStaff = await fetch('http://localhost:5000/api/auth', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!resStaff.ok) throw new Error('Failed to fetch staff accounts');
      const dataStaff = await resStaff.json();
      setAdmins(dataStaff);

      const resGroups = await fetch('http://localhost:5000/api/groups', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!resGroups.ok) throw new Error('Failed to fetch groups');
      const dataGroups = await resGroups.json();
      setGroups(dataGroups);
    } catch (err) {
      setError(err.message);
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
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add staff member');
      }
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', username: '', password: '', role: 'Admin' });
      fetchAdminsAndGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/auth/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove staff member');
      }
      fetchAdminsAndGroups();
    } catch (err) {
      alert(err.message);
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
      const response = await fetch('http://localhost:5000/api/auth/assign-groups', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          employeeId: selectedEmployee._id,
          groupIds: assignedGroupIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update assignments');
      }

      setShowAssignModal(false);
      alert('Group assignments updated successfully!');
      fetchAdminsAndGroups();
    } catch (err) {
      alert(err.message);
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
      const response = await fetch(`http://localhost:5000/api/auth/${selectedStaffForRole._id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user role');
      }

      setShowRoleModal(false);
      alert('User role updated successfully!');
      fetchAdminsAndGroups();
    } catch (err) {
      alert(err.message);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
          <p className="text-slate-500">Manage system administrators and employee accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-500/30 font-medium"
        >
          <Plus size={20} />
          <span>Add Staff Account</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search staff accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm">Name</th>
                <th className="p-4 font-semibold text-sm">Contact</th>
                <th className="p-4 font-semibold text-sm">Username</th>
                <th className="p-4 font-semibold text-sm">Role</th>
                <th className="p-4 font-semibold text-sm">Assigned Groups</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 font-medium">
                    Loading staff members...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 font-medium">
                    No staff members found.
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
                      className="border-b border-slate-100 hover:bg-slate-55/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{admin.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="text-slate-800">{admin.email}</p>
                          <p className="text-slate-500 font-medium">{admin.phone || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                          {admin.username}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleOpenRoleModal(admin)}
                          className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 px-3 py-1 rounded-full w-fit cursor-pointer transition-all border border-indigo-100 hover:border-indigo-200"
                          title="Click to update role"
                        >
                          <UserCog size={14} className="shrink-0" />
                          <span className="text-xs font-extrabold uppercase tracking-wider">{admin.role}</span>
                        </button>
                      </td>
                      <td className="p-4">
                        {admin.role === 'Employee' ? (
                          adminGroups.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {adminGroups.map((g) => (
                                <span
                                  key={g._id}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                                >
                                  {g.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic font-medium">No groups assigned</span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          {admin.role === 'Employee' && (
                            <button
                              onClick={() => handleOpenAssignGroups(admin)}
                              className="flex items-center gap-1 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                              title="Assign Collection Groups"
                            >
                              <Layers size={14} />
                              <span>Assign Groups</span>
                            </button>
                          )}
                          {user._id !== admin._id && (
                            <button
                              onClick={() => handleDelete(admin._id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove Staff Account"
                            >
                              <Trash2 size={18} />
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
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Add New Staff Account</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all text-slate-800 text-sm font-semibold"
                >
                  <option value="Admin">Admin</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6 bg-slate-50 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm shadow-blue-500/30 font-semibold text-sm"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Groups Modal */}
      {showAssignModal && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Assign Groups</h2>
                <p className="text-xs text-slate-500 mt-1">Assign collection groups to <strong className="text-indigo-600">{selectedEmployee.name}</strong></p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
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
                  placeholder="Search groups..."
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-slate-800"
                />
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50 overflow-y-auto max-h-64 border-collapse">
                {groups
                  .filter((group) => group.name?.toLowerCase().includes(assignSearchQuery.toLowerCase()))
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
                        onClick={() => handleToggleGroupAssignment(group._id)}
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50/50 hover:bg-indigo-50/70' : 'bg-white hover:bg-slate-50'
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
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Done by parent div click
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                {groups.filter((group) => group.name?.toLowerCase().includes(assignSearchQuery.toLowerCase())).length === 0 && (
                  <p className="p-4 text-center text-slate-500 text-sm italic font-semibold bg-white">No groups found.</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-150 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                disabled={savingAssign}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm shadow-blue-500/30 font-semibold text-sm disabled:opacity-50"
              >
                {savingAssign ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Role Modal */}
      {showRoleModal && selectedStaffForRole && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Update User Role</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-white border border-slate-200 rounded-lg p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveRole} className="p-6 space-y-4">
              <div className="text-sm text-slate-650 space-y-2 text-left">
                <p>Change system access level for <strong>{selectedStaffForRole.name}</strong> (username: <code>{selectedStaffForRole.username}</code>).</p>
                {selectedStaffForRole._id === user._id && (
                  <p className="text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-100 text-xs font-semibold">
                    ⚠️ You are updating your own profile role. Take caution to prevent lockouts!
                  </p>
                )}
                {newRole === 'Admin' && selectedStaffForRole.role === 'Employee' && (
                  <p className="text-amber-750 bg-amber-50 p-2.5 rounded border border-amber-150 text-xs font-semibold">
                    ⚠️ Promoting this account to Admin will automatically clear any collection groups currently assigned to them.
                  </p>
                )}
              </div>
              
              <div className="text-left">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select New Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 text-sm font-semibold transition-all"
                >
                  <option value="Admin">Admin</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6 bg-slate-50 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRole}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm font-semibold text-sm disabled:opacity-50"
                >
                  {savingRole ? 'Saving...' : 'Update Role'}
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
