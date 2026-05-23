npmimport React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, Users, Search, X, Check } from 'lucide-react';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    fetchGroups();
    fetchCustomers();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/groups');
      setGroups(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      // Show verified customers
      setCustomers(data.filter(c => c.isVerified));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = () => {
    setError('');
    setSuccess('');
    setGroupName('');
    setSearchQuery('');
    setSelectedMembers([]);
    setShowModal(true);
  };

  const toggleMemberSelection = (id) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter(memberId => memberId !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Please select at least one customer to join the group');
      return;
    }

    try {
      await api.post('/groups', {
        name: groupName.trim(),
        members: selectedMembers
      });
      setSuccess('Group created successfully!');
      setTimeout(() => {
        setShowModal(false);
        fetchGroups();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating group');
    }
  };

  const handleDeleteGroup = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the group "${name}"?`)) {
      return;
    }

    try {
      setError('');
      await api.delete(`/groups/${id}`);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete group');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Groups</h1>
          <p className="text-sm text-slate-500 mt-1">Manage joint-liability groups for group loans</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium"
        >
          <Plus size={20} /> Create Group
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Loading groups...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Group Name</th>
                <th className="px-6 py-4">Members</th>
                <th className="px-6 py-4">Member Count</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((group) => (
                <tr key={group._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-2">
                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <Users size={16} />
                    </span>
                    {group.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-lg">
                      {group.members?.map((member) => (
                        <span key={member._id} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {member.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{group.members?.length || 0} Members</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleDeleteGroup(group._id, group.name)}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-semibold transition"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500 font-medium">
                    No groups found. Create one to disburse group loans!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Create Customer Group</h2>
                <p className="text-xs text-slate-500 mt-1">Combine verified customers for joint liability loans</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm font-medium">{error}</div>}
              {success && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">{success}</div>}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Group Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Self-Help Group Alpha"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition text-slate-800"
                  value={groupName} 
                  onChange={e => setGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Select Members ({selectedMembers.length} selected)
                </label>
                
                <div className="relative mb-2">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search size={18} />
                  </span>
                  <input 
                    type="text"
                    placeholder="Search customers by name or phone..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="border border-slate-200 rounded-lg max-h-52 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
                  {filteredCustomers.map(customer => {
                    const isSelected = selectedMembers.includes(customer._id);
                    return (
                      <div 
                        key={customer._id}
                        onClick={() => toggleMemberSelection(customer._id)}
                        className={`flex items-center justify-between p-3 cursor-pointer transition ${
                          isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-100 bg-white'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{customer.name}</p>
                          <p className="text-xs text-slate-500">{customer.phone}</p>
                        </div>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-400 font-medium">No verified customers found.</div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="w-1/2 bg-slate-100 text-slate-700 p-2.5 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-blue-600 text-white p-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
