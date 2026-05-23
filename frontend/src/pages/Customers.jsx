import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Plus, Check, X, Clock, Trash2, Users, Search, PlusCircle, UserPlus, UserCheck,
  ArrowLeft, Edit3, ChevronRight, Layers, Phone, MapPin, CreditCard, Calendar,
  TrendingUp, Percent, DollarSign, CheckCircle2, AlertCircle, Briefcase, Home, Shield,
  BookOpen, ChevronDown, ChevronUp, Printer
} from 'lucide-react';

// Color-coded Credit Gauge Helper
const renderCreditGauge = (score, grade) => {
  const radius = 36;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'stroke-red-500 text-red-600 bg-red-50';
  let trackColorClass = 'stroke-red-100';
  let gradeText = 'High Risk';
  if (grade === 'A') {
    colorClass = 'stroke-emerald-500 text-emerald-600 bg-emerald-50';
    trackColorClass = 'stroke-emerald-100';
    gradeText = 'Low Risk';
  } else if (grade === 'B') {
    colorClass = 'stroke-indigo-500 text-indigo-600 bg-indigo-50';
    trackColorClass = 'stroke-indigo-100';
    gradeText = 'Mod-Low Risk';
  } else if (grade === 'C') {
    colorClass = 'stroke-amber-500 text-amber-600 bg-amber-50';
    trackColorClass = 'stroke-amber-100';
    gradeText = 'Mod-High Risk';
  }

  return (
    <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-lg border border-slate-100 shadow-sm space-y-1">
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            className={trackColorClass}
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className={`${colorClass.split(' ')[0]} transition-all duration-500 ease-out`}
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-sm font-black text-slate-800 leading-none">{score}</span>
          <span className="text-[7px] font-extrabold text-slate-400 mt-0.5">SCORE</span>
        </div>
      </div>
      <div className="text-center">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-extrabold ${
          grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
          grade === 'B' ? 'bg-indigo-100 text-indigo-800' :
          grade === 'C' ? 'bg-amber-100 text-amber-800' :
          'bg-red-100 text-red-800'
        }`}>
          Grade {grade}
        </span>
      </div>
    </div>
  );
};

const Customers = () => {
  const { user } = useContext(AuthContext);
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' or 'customers'
  
  // Data lists
  const [customers, setCustomers] = useState([]);
  const [groups, setGroups] = useState([]);
  
  // Active selected entities
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupLoans, setSelectedGroupLoans] = useState([]);
  
  // Loading states
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingLoans, setLoadingLoans] = useState(false);

  // Search queries
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // UI state for expandable roster cards
  const [expandedCards, setExpandedCards] = useState({});

  // Creation & Management Modals
  const [showModal, setShowModal] = useState(false); // Add Customer Modal
  const [showGroupModal, setShowGroupModal] = useState(false); // Unified Group Builder Modal
  const [showEditMemberModal, setShowEditMemberModal] = useState(false); // Edit Customer Details Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false); // Add Member to Group Modal
  const [showDisburseLoanModal, setShowDisburseLoanModal] = useState(false); // Disburse Group Loan Modal

  // Collection Sheet State
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionSheetData, setCollectionSheetData] = useState(null);
  const [collectionCheckboxState, setCollectionCheckboxState] = useState({});
  const [loadingCollectionSheet, setLoadingCollectionSheet] = useState(false);
  const [submittingCollection, setSubmittingCollection] = useState(false);

  // Main Customer Form initial state
  const initialCustomerState = {
    name: '', phone: '', address: '', fatherName: '', motherName: '',
    spouseName: '', childrenNames: '', totalChildren: '0', aadhaarNumber: '',
    occupation: '', monthlyIncome: '', homeType: '', permanentAddress: '', assets: ''
  };

  // Main Forms State
  const [formData, setFormData] = useState(initialCustomerState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Unified Group Builder Modal Form State
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([
    { isExisting: false, customerId: '', ...initialCustomerState }
  ]);
  const [groupError, setGroupError] = useState('');
  const [groupSuccess, setGroupSuccess] = useState('');
  const [groupLoading, setGroupLoading] = useState(false);

  // Edit Customer Form State
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editCustomerFormData, setEditCustomerFormData] = useState(initialCustomerState);

  // Add Member to active Group Form State
  const [addMemberType, setAddMemberType] = useState('existing'); // 'existing' or 'new'
  const [addMemberCustomerId, setAddMemberCustomerId] = useState('');
  const [addMemberFormData, setAddMemberFormData] = useState(initialCustomerState);

  // Disburse Loan Form State
  const [disburseLoanFormData, setDisburseLoanFormData] = useState({
    amount: '',
    interestRate: '12',
    duration: '12',
    startDate: new Date().toISOString().split('T')[0],
    paymentFrequency: 'Monthly'
  });

  useEffect(() => {
    fetchCustomers();
    fetchGroups();
  }, []);

  // Sync group details if selected group is loaded
  useEffect(() => {
    if (selectedGroup) {
      const refreshed = groups.find(g => g._id === selectedGroup._id);
      if (refreshed) {
        setSelectedGroup(refreshed);
      }
    }
  }, [groups]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const { data } = await api.get('/groups');
      setGroups(data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchGroupLoans = async (groupId) => {
    try {
      setLoadingLoans(true);
      const { data } = await api.get('/loans');
      const filtered = data.filter(l => l.groupId?._id === groupId);
      setSelectedGroupLoans(filtered);
    } catch (err) {
      console.error('Error fetching group loans:', err);
    } finally {
      setLoadingLoans(false);
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    fetchGroupLoans(group._id);
  };

  // Expandable member profile cards toggler
  const toggleCardExpansion = (memberId) => {
    setExpandedCards(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  // Group Deletion
  const handleDeleteGroup = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the group "${name}"?`)) return;
    try {
      await api.delete(`/groups/${id}`);
      fetchGroups();
      if (selectedGroup && selectedGroup._id === id) {
        setSelectedGroup(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting group. Ensure the group has no active loans.');
    }
  };

  // Customer Deletion
  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the customer profile for "${name}"?`)) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
      fetchGroups(); 
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting customer');
    }
  };

  // Single Customer Registration (14 fields)
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        totalChildren: parseInt(formData.totalChildren) || 0,
        monthlyIncome: parseFloat(formData.monthlyIncome) || 0
      };
      await api.post('/customers', payload);
      setShowModal(false);
      setFormData(initialCustomerState);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating customer');
    } finally {
      setLoading(false);
    }
  };

  // Inline Group Builder Row Controls
  const handleOpenGroupModal = () => {
    setGroupName('');
    setGroupMembers([{ isExisting: false, customerId: '', ...initialCustomerState }]);
    setGroupError('');
    setGroupSuccess('');
    setShowGroupModal(true);
  };

  const handleAddMemberRow = () => {
    setGroupMembers([...groupMembers, { isExisting: false, customerId: '', ...initialCustomerState }]);
  };

  const handleRemoveMemberRow = (index) => {
    if (groupMembers.length === 1) return;
    setGroupMembers(groupMembers.filter((_, idx) => idx !== index));
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...groupMembers];
    updated[index][field] = value;
    
    if (field === 'isExisting') {
      updated[index].customerId = '';
      // Reset all details
      Object.keys(initialCustomerState).forEach(k => {
        updated[index][k] = initialCustomerState[k];
      });
    }
    
    if (field === 'customerId' && value) {
      const selected = customers.find(c => c._id === value);
      if (selected) {
        Object.keys(initialCustomerState).forEach(k => {
          updated[index][k] = selected[k] !== undefined ? selected[k] : initialCustomerState[k];
        });
      }
    }

    setGroupMembers(updated);
  };

  // Unified Group Creation Submissions
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setGroupError('');
    setGroupSuccess('');
    setGroupLoading(true);

    if (!groupName.trim()) {
      setGroupError('Group name is required');
      setGroupLoading(false);
      return;
    }

    // Validate members
    for (let i = 0; i < groupMembers.length; i++) {
      const m = groupMembers[i];
      if (m.isExisting) {
        if (!m.customerId) {
          setGroupError(`Please select an existing customer for member #${i + 1}`);
          setGroupLoading(false);
          return;
        }
      } else {
        if (!m.name.trim() || !m.phone.trim() || !m.address.trim()) {
          setGroupError(`Please fill in required details (name, phone, address) for new member #${i + 1}`);
          setGroupLoading(false);
          return;
        }
      }
    }

    const payloadMembers = groupMembers.map(m => {
      if (m.isExisting) {
        return m.customerId;
      } else {
        return {
          name: m.name.trim(),
          phone: m.phone.trim(),
          address: m.address.trim(),
          fatherName: m.fatherName.trim(),
          motherName: m.motherName.trim(),
          spouseName: m.spouseName.trim(),
          childrenNames: m.childrenNames.trim(),
          totalChildren: parseInt(m.totalChildren) || 0,
          aadhaarNumber: m.aadhaarNumber.trim(),
          occupation: m.occupation.trim(),
          monthlyIncome: parseFloat(m.monthlyIncome) || 0,
          homeType: m.homeType,
          permanentAddress: m.permanentAddress.trim() || m.address.trim(),
          assets: m.assets.trim()
        };
      }
    });

    try {
      await api.post('/groups', {
        name: groupName.trim(),
        members: payloadMembers
      });
      setGroupSuccess('Customer group and all new members created successfully!');
      fetchCustomers();
      fetchGroups();
      setTimeout(() => {
        setShowGroupModal(false);
      }, 1500);
    } catch (err) {
      setGroupError(err.response?.data?.message || 'Error creating group');
    } finally {
      setGroupLoading(false);
    }
  };

  // Rename Active Group
  const handleRenameGroup = async () => {
    const newName = prompt('Enter new group name:', selectedGroup?.name);
    if (!newName || !newName.trim() || newName.trim() === selectedGroup?.name) return;
    try {
      const { data } = await api.put(`/groups/${selectedGroup._id}`, { name: newName.trim() });
      setSelectedGroup(data);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Error renaming group');
    }
  };

  // Toggle KYC Verification
  const handleToggleVerification = async (customer) => {
    try {
      const { data } = await api.put(`/customers/${customer._id}`, { isVerified: !customer.isVerified });
      
      // Update selectedGroup UI state
      if (selectedGroup) {
        const updatedMembers = selectedGroup.members.map(m => m._id === customer._id ? data : m);
        setSelectedGroup({ ...selectedGroup, members: updatedMembers });
      }

      setCustomers(customers.map(c => c._id === customer._id ? data : c));
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating verification status');
    }
  };

  // Edit Customer profile triggers
  const handleOpenEditCustomerModal = (customer) => {
    setEditingCustomer(customer);
    setEditCustomerFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      fatherName: customer.fatherName || '',
      motherName: customer.motherName || '',
      spouseName: customer.spouseName || '',
      childrenNames: customer.childrenNames || '',
      totalChildren: customer.totalChildren !== undefined ? String(customer.totalChildren) : '0',
      aadhaarNumber: customer.aadhaarNumber || '',
      occupation: customer.occupation || '',
      monthlyIncome: customer.monthlyIncome !== undefined ? String(customer.monthlyIncome) : '',
      homeType: customer.homeType || '',
      permanentAddress: customer.permanentAddress || '',
      assets: customer.assets || ''
    });
    setShowEditMemberModal(true);
  };

  const handleEditCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editCustomerFormData,
        totalChildren: parseInt(editCustomerFormData.totalChildren) || 0,
        monthlyIncome: parseFloat(editCustomerFormData.monthlyIncome) || 0
      };
      const { data } = await api.put(`/customers/${editingCustomer._id}`, payload);
      
      if (selectedGroup) {
        const updatedMembers = selectedGroup.members.map(m => m._id === editingCustomer._id ? data : m);
        setSelectedGroup({ ...selectedGroup, members: updatedMembers });
      }

      setCustomers(customers.map(c => c._id === editingCustomer._id ? data : c));
      fetchGroups();
      setShowEditMemberModal(false);
      setEditingCustomer(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating customer details');
    }
  };

  // Remove Member from Group
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the group?')) return;
    try {
      const remainingIds = selectedGroup.members.filter(m => m._id !== memberId).map(m => m._id);
      const { data } = await api.put(`/groups/${selectedGroup._id}`, { members: remainingIds });
      setSelectedGroup(data);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing member');
    }
  };

  // Add Member dynamically to Active Group Modal trigger
  const handleOpenAddMemberModal = () => {
    setAddMemberType('existing');
    setAddMemberCustomerId('');
    setAddMemberFormData(initialCustomerState);
    setShowAddMemberModal(true);
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    try {
      let memberPayload;
      if (addMemberType === 'existing') {
        if (!addMemberCustomerId) {
          alert('Please select an existing customer');
          return;
        }
        memberPayload = addMemberCustomerId;
      } else {
        if (!addMemberFormData.name.trim() || !addMemberFormData.phone.trim() || !addMemberFormData.address.trim()) {
          alert('Please fill in required details for new customer');
          return;
        }
        memberPayload = {
          ...addMemberFormData,
          totalChildren: parseInt(addMemberFormData.totalChildren) || 0,
          monthlyIncome: parseFloat(addMemberFormData.monthlyIncome) || 0
        };
      }

      const currentIds = selectedGroup.members.map(m => m._id);
      const { data } = await api.put(`/groups/${selectedGroup._id}`, {
        members: [...currentIds, memberPayload]
      });

      setSelectedGroup(data);
      fetchGroups();
      fetchCustomers();
      setShowAddMemberModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding member to group');
    }
  };

  // Disburse Loan directly from details modal
  const handleDisburseLoanSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/loans', {
        groupId: selectedGroup._id,
        amount: parseFloat(disburseLoanFormData.amount),
        interestRate: parseFloat(disburseLoanFormData.interestRate),
        duration: parseInt(disburseLoanFormData.duration),
        startDate: disburseLoanFormData.startDate,
        paymentFrequency: disburseLoanFormData.paymentFrequency
      });

      alert('Loan disbursed successfully to the group!');
      setShowDisburseLoanModal(false);
      setDisburseLoanFormData({
        amount: '',
        interestRate: '12',
        duration: '12',
        startDate: new Date().toISOString().split('T')[0],
        paymentFrequency: 'Monthly'
      });
      fetchGroupLoans(selectedGroup._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Error disbursing loan');
    }
  };

  // Collection Sheet worksheet handlers
  const handleOpenCollectionSheet = async () => {
    if (!selectedGroup) return;
    try {
      setLoadingCollectionSheet(true);
      setError('');
      const { data } = await api.get(`/groups/${selectedGroup._id}/collection-sheet`);
      setCollectionSheetData(data);
      
      // Initialize checkboxes to true by default for all members and all active loans
      const initialCheckboxState = {};
      data.members.forEach(member => {
        initialCheckboxState[member._id] = {};
        data.activeLoans.forEach(loan => {
          initialCheckboxState[member._id][loan.loanId] = true;
        });
      });
      setCollectionCheckboxState(initialCheckboxState);
      setShowCollectionModal(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Error fetching group collection sheet');
    } finally {
      setLoadingCollectionSheet(false);
    }
  };

  const handleCollectionCheckboxToggle = (memberId, loanId) => {
    setCollectionCheckboxState(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [loanId]: !prev[memberId]?.[loanId]
      }
    }));
  };

  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
    if (!collectionSheetData) return;
    
    setSubmittingCollection(true);
    try {
      // Compile payments payload
      const payments = collectionSheetData.activeLoans.map(loan => {
        const installmentId = loan.nextInstallment.installmentId;
        const paidMembersCount = collectionSheetData.members.filter(member => 
          collectionCheckboxState[member._id]?.[loan.loanId]
        ).length;
        const collectedAmount = paidMembersCount * loan.nextInstallment.sharePerMember;
        
        return {
          installmentId,
          collectedAmount
        };
      }).filter(p => p.collectedAmount > 0);

      if (payments.length === 0) {
        alert('Please check at least one payment to submit');
        setSubmittingCollection(false);
        return;
      }

      await api.post('/installments/bulk-collect', { payments });
      alert('Bulk collections recorded successfully!');
      setShowCollectionModal(false);
      
      // Refresh the group loans and list
      fetchGroupLoans(selectedGroup._id);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting bulk collection');
    } finally {
      setSubmittingCollection(false);
    }
  };

  // Filtering Logic
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    c.phone.includes(customerSearchQuery)
  );

  // Dynamic selector values for existing members
  const availableExistingCustomers = customers.filter(
    c => selectedGroup && !selectedGroup.members.some(m => m._id === c._id)
  );

  // Modular Form Inputs Generator (Reusable & extremely clean)
  const renderCustomerFieldsForm = (values, setValues) => {
    return (
      <div className="space-y-4 text-left">
        {/* Core Personal Details */}
        <fieldset className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/30">
          <legend className="text-xs font-bold text-indigo-600 px-2 bg-white flex items-center gap-1">
            <Users size={12} /> Personal Identity
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
              <input 
                type="text" required
                placeholder="Borrower full name"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.name} onChange={e => setValues({...values, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Number *</label>
              <input 
                type="text" required
                placeholder="10-digit phone"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.phone} onChange={e => setValues({...values, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Aadhaar Number</label>
              <input 
                type="text"
                placeholder="12-digit number"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.aadhaarNumber} onChange={e => setValues({...values, aadhaarNumber: e.target.value})}
              />
            </div>
          </div>
        </fieldset>

        {/* Family Structure */}
        <fieldset className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/30">
          <legend className="text-xs font-bold text-indigo-600 px-2 bg-white flex items-center gap-1">
            <Shield size={12} /> Family Relations
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Father's Name</label>
              <input 
                type="text"
                placeholder="Father's full name"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.fatherName} onChange={e => setValues({...values, fatherName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mother's Name</label>
              <input 
                type="text"
                placeholder="Mother's full name"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.motherName} onChange={e => setValues({...values, motherName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Spouse's Name</label>
              <input 
                type="text"
                placeholder="Husband/Wife's name"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.spouseName} onChange={e => setValues({...values, spouseName: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-600 mb-1">Children Names (Separate with spaces)</label>
              <input 
                type="text"
                placeholder="e.g. Amit Rohit Rahul"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.childrenNames} onChange={e => setValues({...values, childrenNames: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Total Children</label>
              <input 
                type="number" min="0"
                placeholder="0"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.totalChildren} onChange={e => setValues({...values, totalChildren: e.target.value})}
              />
            </div>
          </div>
        </fieldset>

        {/* Finance & Employment */}
        <fieldset className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/30">
          <legend className="text-xs font-bold text-indigo-600 px-2 bg-white flex items-center gap-1">
            <Briefcase size={12} /> Occupation & Financials
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Occupation</label>
              <input 
                type="text"
                placeholder="e.g. Farming, Tailoring, Shopkeeper"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.occupation} onChange={e => setValues({...values, occupation: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Monthly Income (₹)</label>
              <input 
                type="number" min="0"
                placeholder="Income in ₹"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.monthlyIncome} onChange={e => setValues({...values, monthlyIncome: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Home Type</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.homeType} onChange={e => setValues({...values, homeType: e.target.value})}
              >
                <option value="">Select Option</option>
                <option value="Own House">Own House</option>
                <option value="Rented House">Rented House</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Available Assets</label>
            <input 
              type="text"
              placeholder="e.g. Land (1 Acre), Tractor, Cow (2 Nos), Gold Jewelry"
              className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              value={values.assets} onChange={e => setValues({...values, assets: e.target.value})}
            />
          </div>
        </fieldset>

        {/* Addresses */}
        <fieldset className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/30">
          <legend className="text-xs font-bold text-indigo-600 px-2 bg-white flex items-center gap-1">
            <MapPin size={12} /> Address Proofs
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Current Address *</label>
              <textarea 
                required rows="2"
                placeholder="Verified current resident address"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.address} onChange={e => setValues({...values, address: e.target.value})}
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Permanent Address</label>
              <textarea 
                rows="2"
                placeholder="Enter permanent address (leave empty if same as current)"
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={values.permanentAddress} onChange={e => setValues({...values, permanentAddress: e.target.value})}
              ></textarea>
            </div>
          </div>
        </fieldset>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Detail Hub View */}
      {selectedGroup ? (
        <div className="space-y-6 animate-fade-in">
          {/* Header Panel */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedGroup(null)}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                title="Back to Dashboard"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-800">{selectedGroup.name}</h1>
                  {user?.role === 'Admin' && (
                    <button 
                      onClick={handleRenameGroup}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition"
                      title="Rename Group"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>Joint Liability Microfinance Group details and administrative tools</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:inline"></span>
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    Collector: {selectedGroup.collector ? (
                      <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-bold">
                        {selectedGroup.collector.name}
                      </span>
                    ) : (
                      <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-bold">
                        Unassigned
                      </span>
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {user?.role === 'Admin' && (
                <button 
                  onClick={handleOpenAddMemberModal}
                  className="flex-1 md:flex-initial bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition font-semibold text-sm border border-indigo-100 shadow-sm"
                >
                  <UserPlus size={18} /> Add Member
                </button>
              )}
              <button 
                onClick={handleOpenCollectionSheet}
                className="flex-1 md:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition font-semibold text-sm shadow-sm"
              >
                <Layers size={18} /> Collection Sheet
              </button>
              {user?.role === 'Admin' && (
                <>
                  <button 
                    onClick={() => setShowDisburseLoanModal(true)}
                    className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition font-semibold text-sm shadow-sm"
                  >
                    <CreditCard size={18} /> Disburse Loan
                  </button>
                  <button 
                    onClick={() => handleDeleteGroup(selectedGroup._id, selectedGroup.name)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition font-semibold text-sm border border-red-100"
                  >
                    <Trash2 size={18} /> Delete Group
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Group Stats Roster */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Members</p>
                <h3 className="text-xl font-bold text-slate-800 mt-1">{selectedGroup.members?.length || 0} Members</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CreditCard size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Loans</p>
                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  {selectedGroupLoans.filter(l => l.status === 'Active').length} Active
                </h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">KYC Verified Ratio</p>
                <h3 className="text-xl font-bold text-slate-800 mt-1">
                  {selectedGroup.members?.length > 0 
                    ? Math.round((selectedGroup.members.filter(m => m.isVerified).length / selectedGroup.members.length) * 100)
                    : 0}% Verified
                </h3>
              </div>
            </div>
          </div>

          {/* Details Tabs Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Members Roster List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-indigo-600" /> Member Directory
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  {selectedGroup.members?.length || 0} Total
                </span>
              </div>

              {/* Roster Cards with full 14 Details support */}
              <div className="space-y-4">
                {selectedGroup.members?.map((member) => {
                  const isExpanded = !!expandedCards[member._id];
                  return (
                    <div key={member._id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition duration-200">
                      {/* Top Header Card */}
                      <div 
                        className="p-5 flex justify-between items-start cursor-pointer select-none"
                        onClick={() => toggleCardExpansion(member._id)}
                      >
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                            {member.name}
                            {member.isVerified ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                <Check size={8} /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                                <Clock size={8} /> Pending
                              </span>
                            )}
                            {member.riskAnalysis && (
                              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold shadow-sm ${
                                member.riskAnalysis.grade === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                member.riskAnalysis.grade === 'B' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                                member.riskAnalysis.grade === 'C' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                Grade {member.riskAnalysis.grade}
                              </span>
                            )}
                          </h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-xs font-semibold">
                            <span className="flex items-center gap-1"><Phone size={12} /> {member.phone}</span>
                            {member.aadhaarNumber && <span className="flex items-center gap-1"><Shield size={12} /> Aadhaar: {member.aadhaarNumber}</span>}
                            {member.occupation && <span className="flex items-center gap-1"><Briefcase size={12} /> {member.occupation}</span>}
                          </div>
                        </div>

                        <button className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>

                      {/* Expandable 14 Fields Panel with premium layouts */}
                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4 bg-slate-50/20 animate-fade-in text-xs">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            
                            {/* Borrower Credit Risk Scorecard */}
                            <div className="bg-white p-3 rounded-lg border border-slate-150 space-y-3 flex flex-col justify-between">
                              <h5 className="font-bold border-b pb-1 flex items-center gap-1 text-[11px] uppercase tracking-wider text-indigo-600">
                                <Shield size={12} /> Credit Risk Scorecard
                              </h5>
                              
                              {member.riskAnalysis ? (
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                  {/* Gauge Column */}
                                  <div className="sm:col-span-5 flex justify-center">
                                    {renderCreditGauge(member.riskAnalysis.score, member.riskAnalysis.grade)}
                                  </div>
                                  
                                  {/* Factors Column */}
                                  <div className="sm:col-span-7 space-y-2 text-[10px]">
                                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px] mb-1">Score Breakdown</div>
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between items-center bg-slate-50 p-1 rounded">
                                        <span className="font-semibold text-slate-500">Income Stability:</span>
                                        <span className={`font-bold ${member.riskAnalysis.factors.income.points >= 20 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                          {member.riskAnalysis.factors.income.points}/30 pts
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center bg-slate-50 p-1 rounded">
                                        <span className="font-semibold text-slate-500">Housing Status:</span>
                                        <span className={`font-bold ${member.riskAnalysis.factors.home.points >= 15 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                          {member.riskAnalysis.factors.home.points}/25 pts
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center bg-slate-50 p-1 rounded">
                                        <span className="font-semibold text-slate-500">Verified Collateral:</span>
                                        <span className={`font-bold ${member.riskAnalysis.factors.assets.points >= 20 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                          {member.riskAnalysis.factors.assets.points}/25 pts
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center bg-slate-50 p-1 rounded">
                                        <span className="font-semibold text-slate-500">Occupation Status:</span>
                                        <span className={`font-bold ${member.riskAnalysis.factors.occupation.points >= 15 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                          {member.riskAnalysis.factors.occupation.points}/20 pts
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-slate-400 font-semibold italic text-[11px]">
                                  No credit score available. Complete KYC profile to generate.
                                </div>
                              )}

                              {/* Peer Liability / Group Health Alert */}
                              {member.riskAnalysis && (
                                <div className={`mt-2 p-2 rounded-md border text-[9px] flex items-center gap-1.5 ${
                                  member.riskAnalysis.factors.penalty.active 
                                    ? 'bg-red-50 text-red-800 border-red-100' 
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                }`}>
                                  {member.riskAnalysis.factors.penalty.active ? (
                                    <>
                                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                                      <div>
                                        <span className="font-bold block">Peer Liability Penalty Active (-20)</span>
                                        <span className="text-[8px] text-red-600 font-medium">Co-debtor co-borrower has overdue loans.</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                      <div>
                                        <span className="font-bold block">Peer Liability Status: Good</span>
                                        <span className="text-[8px] text-emerald-600 font-medium">All group members are in positive standing.</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Family Details Sub-panel */}
                            <div className="bg-white p-3 rounded-lg border border-slate-150 space-y-2">
                              <h5 className="font-bold border-b pb-1 flex items-center gap-1 text-[11px] uppercase tracking-wider text-indigo-600">
                                <Users size={12} /> Family Information
                              </h5>
                              <div className="grid grid-cols-2 gap-2 text-slate-600">
                                <div>
                                  <span className="font-semibold text-slate-400 block">Father's Name</span>
                                  <span className="font-bold text-slate-800">{member.fatherName || '—'}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-400 block">Mother's Name</span>
                                  <span className="font-bold text-slate-800">{member.motherName || '—'}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-400 block">Spouse's Name</span>
                                  <span className="font-bold text-slate-800">{member.spouseName || '—'}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-400 block">Children Count</span>
                                  <span className="font-bold text-slate-800">{member.totalChildren || 0} Children</span>
                                </div>
                              </div>
                              {member.childrenNames && (
                                <div className="pt-1.5 border-t text-[11px]">
                                  <span className="font-semibold text-slate-400 block">Children Names</span>
                                  <span className="font-bold text-slate-700">{member.childrenNames}</span>
                                </div>
                              )}
                            </div>

                            {/* Financials & Status Sub-panel */}
                            <div className="bg-white p-3 rounded-lg border border-slate-150 space-y-2">
                              <h5 className="font-bold border-b pb-1 flex items-center gap-1 text-[11px] uppercase tracking-wider text-indigo-600">
                                <Briefcase size={12} /> Income & Assets
                              </h5>
                              <div className="grid grid-cols-2 gap-2 text-slate-600">
                                <div>
                                  <span className="font-semibold text-slate-400 block">Monthly Income</span>
                                  <span className="font-extrabold text-slate-800 text-sm">
                                    {member.monthlyIncome ? `₹${member.monthlyIncome.toLocaleString()}` : '—'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-400 block">Home Status</span>
                                  <span className="font-bold text-slate-800">{member.homeType || '—'}</span>
                                </div>
                              </div>
                              {member.assets && (
                                <div className="pt-1.5 border-t text-[11px]">
                                  <span className="font-semibold text-slate-400 block">Available Assets</span>
                                  <span className="font-bold text-slate-700">{member.assets}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Address Details Block */}
                          <div className="bg-white p-3 rounded-lg border border-slate-150 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Current Address</span>
                              <div className="flex gap-1 items-start text-slate-700 font-semibold leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                <span>{member.address}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Permanent Address</span>
                              <div className="flex gap-1 items-start text-slate-700 font-semibold leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                <span>{member.permanentAddress || member.address}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Row */}
                          <div className="flex justify-between items-center pt-3 border-t border-slate-150">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleVerification(member)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                                  member.isVerified 
                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100' 
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                                }`}
                              >
                                {member.isVerified ? 'Revoke Verification' : 'Verify Borrower'}
                              </button>
                              <button
                                onClick={() => handleOpenEditCustomerModal(member)}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-205 transition"
                              >
                                Edit Profile
                              </button>
                            </div>

                            {user?.role === 'Admin' && (
                              <button
                                onClick={() => handleRemoveMember(member._id)}
                                className="text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition"
                              >
                                Remove from Group
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!selectedGroup.members || selectedGroup.members.length === 0) && (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 font-medium">
                    No members inside this group. Click 'Add Member' to register individuals.
                  </div>
                )}
              </div>
            </div>

            {/* Group Loans panel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-600" /> Group Loans Roster
                </h2>
              </div>

              <div className="space-y-3">
                {selectedGroupLoans.map((loan) => (
                  <div key={loan._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-emerald-100 transition duration-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Loan</span>
                        <h4 className="text-lg font-extrabold text-slate-800 mt-0.5">₹{loan.amount.toLocaleString()}</h4>
                      </div>
                      
                      {loan.status === 'Active' ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Paid
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 font-semibold block">
                          {loan.paymentFrequency === 'Weekly' ? 'Weekly Kist' : 'Monthly EMI'}
                        </span>
                        <span className="font-bold text-slate-700">₹{loan.emiAmount}/{loan.paymentFrequency === 'Weekly' ? 'wk' : 'mo'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Rate & Duration</span>
                        <span className="font-bold text-slate-700">
                          {loan.interestRate}% over {loan.duration} {loan.paymentFrequency === 'Weekly' ? 'wks' : 'mos'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Issued: {new Date(loan.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}

                {selectedGroupLoans.length === 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 font-medium">
                    No history of loans disbursed to this group.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Merged Main Dashboard Tabbed Directory */
        <div className="space-y-6">
          {/* Main Titles */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Groups & Customers</h1>
              <p className="text-sm text-slate-500 mt-1">Manage credit rosters, verify borrower KYC profiles, and orchestrate joint liability groups</p>
            </div>
            
            {user?.role === 'Admin' && (
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={handleOpenGroupModal}
                  className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition font-semibold text-sm shadow-sm"
                >
                  <Users size={18} /> Create Group with Members
                </button>
                <button 
                  onClick={() => { setShowModal(true); setError(''); setFormData(initialCustomerState); }}
                  className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition font-semibold text-sm shadow-sm"
                >
                  <Plus size={18} /> Add Customer
                </button>
              </div>
            )}
          </div>

          {/* Premium HSL Tabs Controls */}
          <div className="flex bg-white px-4 rounded-xl border border-slate-100 shadow-sm">
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-6 py-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 -mb-px ${
                activeTab === 'groups'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers size={18} /> Joint Liability Groups ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-6 py-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 -mb-px ${
                activeTab === 'customers'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users size={18} /> Customers Directory ({customers.length})
            </button>
          </div>

          {/* Tab 1: Joint Liability Groups */}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={18} />
                </span>
                <input 
                  type="text"
                  placeholder="Search groups by name..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-sm transition bg-white"
                  value={groupSearchQuery}
                  onChange={e => setGroupSearchQuery(e.target.value)}
                />
              </div>

              {loadingGroups ? (
                <div className="text-center py-12 text-slate-400 font-semibold animate-pulse">Loading Microfinance groups...</div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Group Name</th>
                        <th className="px-6 py-4">Members</th>
                        <th className="px-6 py-4">Member Count</th>
                        <th className="px-6 py-4">Collector</th>
                        <th className="px-6 py-4">Created Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredGroups.map((group) => (
                        <tr key={group._id} className="hover:bg-indigo-50/20 transition cursor-pointer" onClick={() => handleSelectGroup(group)}>
                          <td className="px-6 py-4 font-extrabold text-slate-800 flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                              <Layers size={16} />
                            </span>
                            {group.name}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-md" onClick={e => e.stopPropagation()}>
                              {group.members?.map((member) => (
                                <span 
                                  key={member._id} 
                                  onClick={() => handleOpenEditCustomerModal(member)}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
                                >
                                  {member.name}
                                </span>
                              ))}
                              {(!group.members || group.members.length === 0) && (
                                <span className="text-slate-400 text-xs italic">Empty group</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-bold text-sm">{group.members?.length || 0} Members</td>
                          <td className="px-6 py-4">
                            {group.collector ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100" onClick={e => e.stopPropagation()}>
                                {group.collector.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-150 text-slate-500 border border-slate-200" onClick={e => e.stopPropagation()}>
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-semibold">
                            {new Date(group.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleSelectGroup(group)}
                                className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-indigo-100"
                              >
                                View Hub <ChevronRight size={14} />
                              </button>
                              {user?.role === 'Admin' && (
                                <button 
                                  onClick={() => handleDeleteGroup(group._id, group.name)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                                  title="Delete Group"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredGroups.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-semibold">
                            No microfinance groups found. Set one up to initiate joint liability operations.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Customers Directory */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={18} />
                </span>
                <input 
                  type="text"
                  placeholder="Search customers by name or phone..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm transition bg-white"
                  value={customerSearchQuery}
                  onChange={e => setCustomerSearchQuery(e.target.value)}
                />
              </div>

              {loadingCustomers ? (
                <div className="text-center py-12 text-slate-400 font-semibold animate-pulse">Loading customers...</div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Phone</th>
                        <th className="px-6 py-4">Aadhaar</th>
                        <th className="px-6 py-4">Occupation</th>
                        <th className="px-6 py-4">Income</th>
                        <th className="px-6 py-4">Home Status</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 font-extrabold text-slate-800">{c.name}</td>
                          <td className="px-6 py-4 text-slate-600 font-bold text-xs">{c.phone}</td>
                          <td className="px-6 py-4 text-slate-500 font-bold text-xs">{c.aadhaarNumber || '—'}</td>
                          <td className="px-6 py-4 text-slate-500 font-semibold text-xs">{c.occupation || '—'}</td>
                          <td className="px-6 py-4 text-slate-700 font-extrabold text-xs">
                            {c.monthlyIncome ? `₹${c.monthlyIncome.toLocaleString()}` : '—'}
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-semibold text-xs">{c.homeType || '—'}</td>
                          <td className="px-6 py-4">
                            {c.isVerified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 cursor-pointer" onClick={() => handleToggleVerification(c)}>
                                <Check size={12} /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 cursor-pointer" onClick={() => handleToggleVerification(c)}>
                                <Clock size={12} /> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleOpenEditCustomerModal(c)}
                                className="text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-slate-200"
                              >
                                Edit Profile
                              </button>
                              {user?.role === 'Admin' && (
                                <button 
                                  onClick={() => handleDeleteCustomer(c._id, c.name)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                                  title="Delete Customer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-6 py-10 text-center text-slate-500 font-semibold">No customers found in directory.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Single Customer Modal (14 Fields layout) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Add New Borrower Profile</h2>
                <p className="text-xs text-slate-500 mt-1">Register a new client profile with comprehensive 14 verification details</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border border-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs font-bold">{error}</div>}
              
              {renderCustomerFieldsForm(formData, setFormData)}
              
              <div className="pt-4 border-t border-slate-100 mt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="w-1/2 bg-slate-100 text-slate-700 p-3 rounded-lg font-bold hover:bg-slate-200 transition text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-1/2 bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-blue-400 text-xs shadow-sm"
                >
                  {loading ? 'Registering Borrower...' : 'Register Borrower Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group with Inline Members Modal (Comprehensive Fields Support) */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Create Joint Liability Group with Members</h2>
                <p className="text-xs text-slate-500 mt-1">Setup a customer group and onboard member profiles concurrently with complete files</p>
              </div>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border border-slate-200">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto p-6 space-y-6">
              {groupError && <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs font-bold">{groupError}</div>}
              {groupSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">{groupSuccess}</div>}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Group Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Unity Self-Help Group"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition text-slate-800 text-sm font-semibold"
                  value={groupName} 
                  onChange={e => setGroupName(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-extrabold text-slate-700">Group Members Roster Details</h3>
                  <button 
                    type="button"
                    onClick={handleAddMemberRow}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-bold transition"
                  >
                    <PlusCircle size={16} /> Add Member Row
                  </button>
                </div>

                <div className="space-y-6">
                  {groupMembers.map((member, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4 relative animate-fade-in">
                      {groupMembers.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveMemberRow(idx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition p-1 hover:bg-white rounded border border-slate-200 bg-slate-50"
                          title="Remove Member"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleMemberChange(idx, 'isExisting', false)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                            !member.isExisting ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <UserPlus size={12} /> New Customer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMemberChange(idx, 'isExisting', true)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition ${
                            member.isExisting ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <UserCheck size={12} /> Existing Customer
                        </button>
                      </div>

                      {member.isExisting ? (
                        <div className="text-left">
                          <label className="block text-xs font-bold text-slate-600 mb-1">Select Customer</label>
                          <select 
                            required
                            className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                            value={member.customerId}
                            onChange={e => handleMemberChange(idx, 'customerId', e.target.value)}
                          >
                            <option value="">Choose a registered customer</option>
                            {customers.map(c => (
                              <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        renderCustomerFieldsForm(member, (val) => {
                          const updated = [...groupMembers];
                          updated[idx] = { ...updated[idx], ...val };
                          setGroupMembers(updated);
                        })
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-6 flex gap-3 bg-slate-50 p-4 -m-6 rounded-b-xl border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setShowGroupModal(false)}
                  className="w-1/2 bg-slate-200 text-slate-700 p-3 rounded-lg font-bold hover:bg-slate-300 transition text-xs border border-slate-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={groupLoading}
                  className="w-1/2 bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:bg-indigo-400 text-xs shadow-sm"
                >
                  {groupLoading ? 'Creating Group & Roster Members...' : 'Create Group & Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Profile details Modal (14 Fields layout) */}
      {showEditMemberModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Edit Customer Profile</h2>
                <p className="text-xs text-slate-500 mt-1">Modify registered data details for credit verification and security checks</p>
              </div>
              <button onClick={() => { setShowEditMemberModal(false); setEditingCustomer(null); }} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border border-slate-200">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditCustomerSubmit} className="p-6 space-y-4">
              {renderCustomerFieldsForm(editCustomerFormData, setEditCustomerFormData)}

              <div className="pt-4 border-t border-slate-100 mt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setShowEditMemberModal(false); setEditingCustomer(null); }}
                  className="w-1/2 bg-slate-100 text-slate-700 p-3 rounded-lg font-bold hover:bg-slate-200 transition text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition text-xs shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member dynamically to Active Group Modal (14 Fields layout) */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Add Member to {selectedGroup?.name}</h2>
                <p className="text-xs text-slate-500 mt-1">Associate a customer with the active joint liability roster</p>
              </div>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border border-slate-200">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddMemberType('existing')}
                  className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold transition border ${
                    addMemberType === 'existing' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <UserCheck size={14} /> Registered Customer
                </button>
                <button
                  type="button"
                  onClick={() => setAddMemberType('new')}
                  className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold transition border ${
                    addMemberType === 'new' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <UserPlus size={14} /> Onboard New
                </button>
              </div>

              {addMemberType === 'existing' ? (
                <div className="text-left pt-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Select Customer</label>
                  {availableExistingCustomers.length > 0 ? (
                    <select 
                      required
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                      value={addMemberCustomerId}
                      onChange={e => setAddMemberCustomerId(e.target.value)}
                    >
                      <option value="">Choose a verified customer</option>
                      {availableExistingCustomers.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 text-center text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-semibold">
                      No registered customers available to join this group.
                    </div>
                  )}
                </div>
              ) : (
                renderCustomerFieldsForm(addMemberFormData, setAddMemberFormData)
              )}

              <div className="pt-4 border-t border-slate-100 mt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddMemberModal(false)}
                  className="w-1/2 bg-slate-100 text-slate-700 p-3 rounded-lg font-bold hover:bg-slate-200 transition text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition text-xs shadow-sm"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Group Loan Modal */}
      {showDisburseLoanModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Disburse Group Loan</h2>
                <p className="text-xs text-slate-500 mt-1">Issue a joint-liability loan to the {selectedGroup.name}</p>
              </div>
              <button onClick={() => setShowDisburseLoanModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border border-slate-200">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleDisburseLoanSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Loan Principal Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">₹</span>
                    <input 
                      type="number" required min="1000" step="500"
                      placeholder="e.g. 50000"
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={disburseLoanFormData.amount} onChange={e => setDisburseLoanFormData({...disburseLoanFormData, amount: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Payment Frequency</label>
                    <select
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={disburseLoanFormData.paymentFrequency} onChange={e => setDisburseLoanFormData({...disburseLoanFormData, paymentFrequency: e.target.value})}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly (Kist)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Duration {disburseLoanFormData.paymentFrequency === 'Weekly' ? '(Weeks)' : '(Months)'}
                    </label>
                    <input 
                      type="number" required min="1"
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={disburseLoanFormData.duration} onChange={e => setDisburseLoanFormData({...disburseLoanFormData, duration: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Annual Interest (%)</label>
                    <div className="relative">
                      <input 
                        type="number" required min="0" max="100" step="0.5"
                        className="w-full pr-8 pl-3 py-2.5 border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        value={disburseLoanFormData.interestRate} onChange={e => setDisburseLoanFormData({...disburseLoanFormData, interestRate: e.target.value})}
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Disbursement Date</label>
                    <input 
                      type="date" required
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={disburseLoanFormData.startDate} onChange={e => setDisburseLoanFormData({...disburseLoanFormData, startDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-6 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowDisburseLoanModal(false)}
                    className="w-1/2 bg-slate-100 text-slate-700 p-2.5 rounded-lg font-bold hover:bg-slate-200 transition text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-emerald-600 text-white p-2.5 rounded-lg font-bold hover:bg-emerald-700 transition text-sm shadow-sm"
                  >
                    Disburse
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Collection Sheet & Worksheet Modal */}
      {showCollectionModal && collectionSheetData && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col my-8 max-h-[90vh] print:shadow-none print:my-0 print:max-h-full print:rounded-none">
            
            {/* Inline print style sheet */}
            <style>{`
              @media print {
                body > div {
                  display: none !important;
                }
                #root {
                  display: none !important;
                }
                .fixed.inset-0.z-50 {
                  display: block !important;
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                  background: white !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .fixed.inset-0.z-50 * {
                  visibility: visible !important;
                }
                .no-print, .print\\:hidden, button, svg {
                  display: none !important;
                }
                table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  page-break-inside: auto !important;
                }
                tr {
                  page-break-inside: avoid !important;
                  page-break-after: auto !important;
                }
              }
            `}</style>

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 print:bg-white print:border-b-2 print:border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 print:text-2xl print:font-black flex items-center gap-2">
                  <Layers className="text-indigo-600 print:hidden" size={24} />
                  <span>Weekly Collection Worksheet</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 print:text-slate-700">
                  Roster Group: <strong className="text-indigo-600 print:text-slate-900">{collectionSheetData.groupName}</strong> | Date: {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg font-bold text-xs border border-indigo-100 flex items-center gap-1 shadow-sm transition"
                >
                  <Printer size={14} /> Print Sheet
                </button>
                <button 
                  onClick={() => { setShowCollectionModal(false); setCollectionSheetData(null); }} 
                  className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border border-slate-200"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 print:overflow-visible print:p-0">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 print:bg-white print:border-none print:p-0">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 print:text-slate-700 print:mb-4">
                  Active Installments & Ledger Split
                </div>
                
                {collectionSheetData.activeLoans.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-semibold italic bg-white rounded-lg border border-slate-200">
                    No active loans with pending installments found for this group.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse bg-white rounded-lg border border-slate-200 print:border-slate-800 print:text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider print:bg-slate-100 print:border-b-2 print:border-slate-800">
                          <th className="px-4 py-3 print:px-2 print:py-1">Group Member</th>
                          {collectionSheetData.activeLoans.map((loan, idx) => (
                            <th key={loan.loanId} className="px-4 py-3 border-l border-slate-200 print:px-2 print:py-1">
                              <div>Loan #{idx + 1} (Principal: ₹{loan.amount.toLocaleString()})</div>
                              <div className="text-[10px] text-slate-400 font-normal normal-case mt-0.5 print:text-slate-700">
                                Next Due: ₹{loan.nextInstallment.totalDue.toLocaleString()} ({loan.paymentFrequency})
                              </div>
                              <div className="text-[10px] text-indigo-600 font-extrabold uppercase mt-0.5 print:text-slate-900">
                                Share: ₹{loan.nextInstallment.sharePerMember.toLocaleString()}/member
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 border-l border-slate-200 text-right print:px-2 print:py-1">Member Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 print:divide-slate-800">
                        {collectionSheetData.members.map((member) => {
                          let memberRowTotal = 0;
                          return (
                            <tr key={member._id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-4 font-bold text-slate-800 print:px-2 print:py-1">
                                <div>{member.name}</div>
                                <div className="text-[10px] text-slate-400 font-normal print:text-slate-600">{member.phone}</div>
                              </td>
                              
                              {collectionSheetData.activeLoans.map((loan) => {
                                const isChecked = !!collectionCheckboxState[member._id]?.[loan.loanId];
                                const share = loan.nextInstallment.sharePerMember;
                                if (isChecked) {
                                  memberRowTotal += share;
                                }
                                return (
                                  <td key={loan.loanId} className="px-4 py-4 border-l border-slate-200 print:px-2 print:py-1">
                                    <div className="flex items-center gap-3 print:justify-between">
                                      <label className="flex items-center gap-2 cursor-pointer print:hidden">
                                        <input
                                          type="checkbox"
                                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                          checked={isChecked}
                                          onChange={() => handleCollectionCheckboxToggle(member._id, loan.loanId)}
                                        />
                                        <span className="font-extrabold text-slate-700 text-sm">₹{share.toLocaleString()}</span>
                                      </label>
                                      
                                      {/* Print-only checkbox mark */}
                                      <div className="hidden print:block font-bold">
                                        <div className="border border-slate-800 w-4 h-4 rounded flex items-center justify-center text-[10px]">
                                          {isChecked ? '✓' : ' '}
                                        </div>
                                      </div>
                                      <div className="hidden print:block text-slate-800 font-bold">
                                        ₹{share.toLocaleString()}
                                      </div>

                                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                        loan.nextInstallment.status === 'Overdue' 
                                          ? 'bg-red-50 text-red-700 border border-red-100' 
                                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                      }`}>
                                        {loan.nextInstallment.status}
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}
                              
                              <td className="px-4 py-4 border-l border-slate-200 text-right font-black text-slate-800 text-sm print:px-2 print:py-1">
                                ₹{memberRowTotal.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Summary Totals Row */}
                        <tr className="bg-indigo-50/30 font-black border-t-2 border-indigo-200 print:bg-slate-50 print:border-t-2 print:border-slate-800">
                          <td className="px-4 py-3 print:px-2 print:py-1">Expected Loan Installments:</td>
                          {collectionSheetData.activeLoans.map((loan) => {
                            const expectedTotal = loan.nextInstallment.totalDue;
                            const collectedTotalForLoan = collectionSheetData.members.filter(member => 
                              collectionCheckboxState[member._id]?.[loan.loanId]
                            ).length * loan.nextInstallment.sharePerMember;
                            
                            return (
                              <td key={loan.loanId} className="px-4 py-3 border-l border-slate-200 print:px-2 print:py-1">
                                <div className="text-slate-800 text-[11px] font-extrabold">
                                  Collected: <span className="text-emerald-700">₹{collectedTotalForLoan.toLocaleString()}</span>
                                </div>
                                <div className="text-slate-400 text-[9px] font-bold mt-0.5 print:text-slate-700">
                                  Expected: ₹{expectedTotal.toLocaleString()}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 border-l border-slate-200 text-right text-base text-indigo-900 print:px-2 print:py-1 print:text-[11px]">
                            ₹{
                              collectionSheetData.activeLoans.reduce((acc, loan) => {
                                const collectedTotalForLoan = collectionSheetData.members.filter(member => 
                                  collectionCheckboxState[member._id]?.[loan.loanId]
                                ).length * loan.nextInstallment.sharePerMember;
                                return acc + collectedTotalForLoan;
                              }, 0).toLocaleString()
                            }
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Dynamic Totals Tracker Card */}
              {collectionSheetData.activeLoans.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 text-white p-5 rounded-xl shadow-sm border border-slate-800 print:bg-white print:border-2 print:border-slate-800 print:text-slate-900 print:p-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider print:text-slate-500">Group Weekly Target</span>
                    <h3 className="text-xl font-black mt-1 print:text-lg">
                      ₹{collectionSheetData.activeLoans.reduce((sum, l) => sum + l.nextInstallment.totalDue, 0).toLocaleString()}
                    </h3>
                  </div>
                  <div className="border-t border-slate-800 md:border-t-0 md:border-l md:pl-6 pt-3 md:pt-0 print:border-slate-300">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider print:text-emerald-600">Collected Amount</span>
                    <h3 className="text-xl font-black mt-1 text-emerald-400 print:text-emerald-600 print:text-lg">
                      ₹{
                        collectionSheetData.activeLoans.reduce((sum, loan) => {
                          const count = collectionSheetData.members.filter(member => 
                            collectionCheckboxState[member._id]?.[loan.loanId]
                          ).length;
                          return sum + (count * loan.nextInstallment.sharePerMember);
                        }, 0).toLocaleString()
                      }
                    </h3>
                  </div>
                  <div className="border-t border-slate-800 md:border-t-0 md:border-l md:pl-6 pt-3 md:pt-0 print:border-slate-300">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider print:text-amber-600">Outstanding Balance</span>
                    <h3 className="text-xl font-black mt-1 text-amber-400 print:text-amber-600 print:text-lg">
                      ₹{
                        Math.max(0, 
                          collectionSheetData.activeLoans.reduce((sum, l) => sum + l.nextInstallment.totalDue, 0) -
                          collectionSheetData.activeLoans.reduce((sum, loan) => {
                            const count = collectionSheetData.members.filter(member => 
                              collectionCheckboxState[member._id]?.[loan.loanId]
                            ).length;
                            return sum + (count * loan.nextInstallment.sharePerMember);
                          }, 0)
                        ).toLocaleString()
                      }
                    </h3>
                  </div>
                </div>
              )}

              {/* Print-Only Signature Section */}
              <div className="hidden print:grid print:grid-cols-3 print:gap-8 print:pt-16 print:text-[11px] print:font-bold">
                <div className="text-center border-t border-slate-800 pt-2">
                  Field Officer Signature
                </div>
                <div className="text-center border-t border-slate-800 pt-2">
                  Group Leader Signature
                </div>
                <div className="text-center border-t border-slate-800 pt-2">
                  Branch Manager Signature
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 print:hidden">
              <button 
                type="button" 
                onClick={() => { setShowCollectionModal(false); setCollectionSheetData(null); }}
                className="w-1/2 bg-slate-200 text-slate-700 p-3 rounded-lg font-bold hover:bg-slate-300 transition text-xs border border-slate-300"
              >
                Close Worksheet
              </button>
              <button 
                type="button" 
                disabled={submittingCollection || collectionSheetData.activeLoans.length === 0}
                onClick={handleCollectionSubmit}
                className="w-1/2 bg-emerald-600 text-white p-3 rounded-lg font-bold hover:bg-emerald-700 transition disabled:bg-emerald-400 text-xs shadow-sm"
              >
                {submittingCollection ? 'Recording Bulk Collections...' : 'Submit Group Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
