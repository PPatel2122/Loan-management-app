import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Plus, Check, X, Clock, Trash2, Users, Search, PlusCircle, UserPlus, UserCheck,
  ArrowLeft, Edit3, ChevronRight, Layers, Phone, MapPin, CreditCard, Calendar,
  TrendingUp, Percent, DollarSign, CheckCircle2, AlertCircle, Briefcase, Home, Shield,
  BookOpen, ChevronDown, ChevronUp, Printer, Camera
} from 'lucide-react';

// Color-coded Credit Gauge Helper (Redesigned with premium neon rings and typography)
const compressImage = (file, maxWidth = 600, quality = 0.6) => {
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

const renderCreditGauge = (score, grade) => {
  const radius = 36;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'stroke-rose-500 text-rose-600 bg-rose-50 border-rose-100';
  let trackColorClass = 'stroke-rose-100/60';
  let gradeText = 'High Risk';
  if (grade === 'A') {
    colorClass = 'stroke-emerald-500 text-emerald-600 bg-emerald-50 border-emerald-100';
    trackColorClass = 'stroke-emerald-100/60';
    gradeText = 'Low Risk';
  } else if (grade === 'B') {
    colorClass = 'stroke-indigo-500 text-indigo-600 bg-indigo-50 border-indigo-100';
    trackColorClass = 'stroke-indigo-100/60';
    gradeText = 'Mod-Low Risk';
  } else if (grade === 'C') {
    colorClass = 'stroke-amber-500 text-amber-600 bg-amber-50 border-amber-100';
    trackColorClass = 'stroke-amber-100/60';
    gradeText = 'Mod-High Risk';
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm space-y-1.5 min-w-[90px] transition-premium hover:shadow-md">
      <div className="relative flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
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
          <span className="text-[7px] font-extrabold text-slate-400 mt-0.5 tracking-wider">SCORE</span>
        </div>
      </div>
      <div className="text-center">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wide uppercase ${
          grade === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          grade === 'B' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
          grade === 'C' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
          'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {gradeText}
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
    name: '', phone: '', email: '', address: '', fatherName: '', motherName: '',
    spouseName: '', childrenNames: '', totalChildren: '0', aadhaarNumber: '',
    occupation: '', monthlyIncome: '', homeType: '', permanentAddress: '', assets: '',
    customerPhoto: '', aadhaarPhoto: '',
    emailVerified: false,
    otpSent: false,
    otpCode: '',
    otpError: '',
    otpSuccess: '',
    otpLoading: false,
    otpVerifyLoading: false
  };

  // Main Forms State
  const [formData, setFormData] = useState(initialCustomerState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerFormStep, setCustomerFormStep] = useState(1);
  const [groupFormStep, setGroupFormStep] = useState(1);
  const [addMemberFormStep, setAddMemberFormStep] = useState(1);

  const handleImageCapture = async (e, field, setValues, values) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImage(file);
      setValues({
        ...values,
        [field]: compressedBase64
      });
    } catch (err) {
      console.error('Error capturing image:', err);
      alert('Failed to capture and compress image. Please try again.');
    }
  };

  const handleSendOTPClick = async (values, setValues) => {
    if (!values.email) return;
    setValues({ ...values, otpLoading: true, otpError: '', otpSuccess: '' });
    try {
      await api.post('/customers/send-otp', { email: values.email });
      setValues({ 
        ...values, 
        otpSent: true, 
        otpLoading: false, 
        otpSuccess: 'OTP has been successfully sent to customer email!' 
      });
    } catch (err) {
      setValues({ 
        ...values, 
        otpLoading: false, 
        otpError: err.response?.data?.message || 'Failed to send OTP.' 
      });
    }
  };

  const handleVerifyOTPClick = async (values, setValues) => {
    if (!values.email || !values.otpCode) return;
    setValues({ ...values, otpVerifyLoading: true, otpError: '', otpSuccess: '' });
    try {
      await api.post('/customers/verify-otp', { email: values.email, otp: values.otpCode });
      setValues({ 
        ...values, 
        emailVerified: true, 
        otpVerifyLoading: false, 
        otpSuccess: 'Email address verified successfully!' 
      });
    } catch (err) {
      setValues({ 
        ...values, 
        otpVerifyLoading: false, 
        otpError: err.response?.data?.message || 'Invalid OTP code.' 
      });
    }
  };

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

  const handleNextStep = () => {
    setError('');
    if (customerFormStep === 1) {
      if (!formData.name?.trim()) {
        setError('Full Name is required');
        return;
      }
      if (!formData.phone?.trim()) {
        setError('Mobile Number is required');
        return;
      }
      if (!formData.email?.trim()) {
        setError('Email Address is required');
        return;
      }
      if (!formData.emailVerified) {
        setError("Please verify the customer's email address first.");
        return;
      }
    } else if (customerFormStep === 2) {
      if (!formData.address?.trim()) {
        setError('Current Address is required');
        return;
      }
    }
    setCustomerFormStep(prev => prev + 1);
  };

  const handleNextGroupStep = () => {
    setGroupError('');
    if (!groupName?.trim()) {
      setGroupError('Group recipient name is required');
      return;
    }
    setGroupFormStep(2);
  };

  const handleNextAddMemberStep = () => {
    setError('');
    if (addMemberFormStep === 1) {
      if (!addMemberFormData.name?.trim()) {
        setError('Full Name is required');
        return;
      }
      if (!addMemberFormData.phone?.trim()) {
        setError('Mobile Number is required');
        return;
      }
      if (!addMemberFormData.email?.trim()) {
        setError('Email Address is required');
        return;
      }
      if (!addMemberFormData.emailVerified) {
        setError("Please verify the customer's email address first.");
        return;
      }
    } else if (addMemberFormStep === 2) {
      if (!addMemberFormData.address?.trim()) {
        setError('Current Address is required');
        return;
      }
    }
    setAddMemberFormStep(prev => prev + 1);
  };

  // Single Customer Registration (14 fields)
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!formData.emailVerified) {
      setError("Please verify the customer's email address first.");
      setLoading(false);
      return;
    }
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
    setGroupFormStep(1);
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
        if (!m.emailVerified) {
          setGroupError(`Please verify the email address for new member #${i + 1}`);
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
          email: m.email.trim(),
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
          assets: m.assets.trim(),
          customerPhoto: m.customerPhoto || '',
          aadhaarPhoto: m.aadhaarPhoto || ''
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
      email: customer.email || '',
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
      assets: customer.assets || '',
      customerPhoto: customer.customerPhoto || '',
      aadhaarPhoto: customer.aadhaarPhoto || '',
      emailVerified: customer.email ? true : false,
      otpSent: false,
      otpCode: '',
      otpError: '',
      otpSuccess: '',
      otpLoading: false,
      otpVerifyLoading: false
    });
    setShowEditMemberModal(true);
  };

  const handleEditCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!editCustomerFormData.email) {
      alert("Email is required.");
      return;
    }
    if (editCustomerFormData.email !== editingCustomer.email && !editCustomerFormData.emailVerified) {
      alert("Please verify the new email address first.");
      return;
    }
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
    setAddMemberFormStep(1);
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
        if (!addMemberFormData.emailVerified) {
          alert("Please verify the new customer's email address first.");
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

  // Modular Form Inputs Generator (Redesigned with premium input cards & details)
  // Modular Form Inputs Generator (Redesigned with premium input cards & details)
  const renderCustomerFieldsForm = (values, setValues, step = null) => {
    return (
      <div className="space-y-5 text-left">
        {/* Step 1: Core Personal Details */}
        {(step === null || step === 1) && (
          <fieldset className="border border-slate-100 p-5 rounded-2xl space-y-4 bg-slate-50/50 shadow-sm animate-fade-in">
            <legend className="text-xs font-bold text-violet-600 px-3 py-0.5 rounded-full bg-violet-50 border border-violet-100 flex items-center gap-1">
              <Users size={12} /> Personal Identity Details
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name *</label>
                <input 
                  type="text" required
                  placeholder="Borrower's complete name"
                  className="premium-input"
                  value={values.name} onChange={e => setValues({...values, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mobile Number *</label>
                <input 
                  type="text" required
                  placeholder="10-digit number"
                  className="premium-input"
                  value={values.phone} onChange={e => setValues({...values, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Aadhaar Number</label>
                <input 
                  type="text"
                  placeholder="12-digit UIDAI ID"
                  className="premium-input"
                  value={values.aadhaarNumber} onChange={e => setValues({...values, aadhaarNumber: e.target.value})}
                />
              </div>
            </div>

            {/* Email Address & Verification Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address *</label>
                <div className="flex gap-2">
                  <input 
                    type="email" required
                    placeholder="e.g. borrower@example.com"
                    className="premium-input flex-1"
                    disabled={values.emailVerified}
                    value={values.email || ''} 
                    onChange={e => setValues({
                      ...values, 
                      email: e.target.value,
                      emailVerified: false,
                      otpSent: false,
                      otpCode: '',
                      otpError: '',
                      otpSuccess: ''
                    })}
                  />
                  {!values.emailVerified ? (
                    <button
                      type="button"
                      disabled={!values.email || values.otpLoading}
                      onClick={() => handleSendOTPClick(values, setValues)}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center min-w-[100px] cursor-pointer"
                    >
                      {values.otpLoading ? 'Sending...' : (values.otpSent ? 'Resend OTP' : 'Verify Email')}
                    </button>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-705 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* OTP Verification Input Sub-panel */}
            {values.otpSent && !values.emailVerified && (
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mt-3 space-y-3">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="flex-1 text-left">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-650 mb-1.5">Enter 6-digit OTP Code *</label>
                    <input 
                      type="text" required
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="premium-input w-full text-center tracking-[0.5em] font-mono text-lg"
                      value={values.otpCode} 
                      onChange={e => setValues({...values, otpCode: e.target.value.replace(/\D/g, '')})}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={values.otpCode.length !== 6 || values.otpVerifyLoading}
                    onClick={() => handleVerifyOTPClick(values, setValues)}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center min-w-[120px] cursor-pointer"
                  >
                    {values.otpVerifyLoading ? 'Verifying...' : 'Submit OTP'}
                  </button>
                </div>
                
                <p className="text-[10px] text-slate-500">
                  OTP sent to <strong>{values.email}</strong>. Please check your inbox or spam folder.
                </p>
              </div>
            )}

            {/* OTP Verification feedback messages */}
            {values.otpError && (
              <div className="bg-red-50 text-red-700 border border-red-150 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 mt-2">
                ⚠️ {values.otpError}
              </div>
            )}
            {values.otpSuccess && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 mt-2">
                ✓ {values.otpSuccess}
              </div>
            )}
          </fieldset>
        )}

        {/* Step 2: Address Credentials */}
        {(step === null || step === 2) && (
          <fieldset className="border border-slate-100 p-5 rounded-2xl space-y-4 bg-slate-50/50 shadow-sm animate-fade-in">
            <legend className="text-xs font-bold text-violet-600 px-3 py-0.5 rounded-full bg-violet-50 border border-violet-100 flex items-center gap-1">
              <MapPin size={12} /> Address Credentials
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Current Address *</label>
                <textarea 
                  required rows="2"
                  placeholder="Verified current local address"
                  className="premium-input"
                  value={values.address} onChange={e => setValues({...values, address: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Permanent Address</label>
                <textarea 
                  rows="2"
                  placeholder="Permanent home address (Leave blank if same)"
                  className="premium-input"
                  value={values.permanentAddress} onChange={e => setValues({...values, permanentAddress: e.target.value})}
                ></textarea>
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 3: Family Structure */}
        {(step === null || step === 3) && (
          <fieldset className="border border-slate-100 p-5 rounded-2xl space-y-4 bg-slate-50/50 shadow-sm animate-fade-in">
            <legend className="text-xs font-bold text-violet-600 px-3 py-0.5 rounded-full bg-violet-50 border border-violet-100 flex items-center gap-1">
              <Shield size={12} /> Family Relations
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Father's Name</label>
                <input 
                  type="text"
                  placeholder="Father's full name"
                  className="premium-input"
                  value={values.fatherName} onChange={e => setValues({...values, fatherName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mother's Name</label>
                <input 
                  type="text"
                  placeholder="Mother's full name"
                  className="premium-input"
                  value={values.motherName} onChange={e => setValues({...values, motherName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Spouse's Name</label>
                <input 
                  type="text"
                  placeholder="Husband/Wife's name"
                  className="premium-input"
                  value={values.spouseName} onChange={e => setValues({...values, spouseName: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Children Names (Separate with spaces)</label>
                <input 
                  type="text"
                  placeholder="e.g. Amit Rohit Rahul"
                  className="premium-input"
                  value={values.childrenNames} onChange={e => setValues({...values, childrenNames: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Total Children</label>
                <input 
                  type="number" min="0"
                  placeholder="0"
                  className="premium-input"
                  value={values.totalChildren} onChange={e => setValues({...values, totalChildren: e.target.value})}
                />
              </div>
            </div>
          </fieldset>
        )}

        {/* Step 4: Finance & Employment */}
        {(step === null || step === 4) && (
          <fieldset className="border border-slate-100 p-5 rounded-2xl space-y-4 bg-slate-50/50 shadow-sm animate-fade-in">
            <legend className="text-xs font-bold text-violet-600 px-3 py-0.5 rounded-full bg-violet-50 border border-violet-100 flex items-center gap-1">
              <Briefcase size={12} /> Occupation & Financial Ratios
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Occupation / Job</label>
                <input 
                  type="text"
                  placeholder="e.g. Farming, Tailoring, Dairy"
                  className="premium-input"
                  value={values.occupation} onChange={e => setValues({...values, occupation: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Monthly Income (₹)</label>
                <input 
                  type="number" min="0"
                  placeholder="Income in ₹"
                  className="premium-input"
                  value={values.monthlyIncome} onChange={e => setValues({...values, monthlyIncome: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Residence Status</label>
                <select 
                  className="premium-select"
                  value={values.homeType} onChange={e => setValues({...values, homeType: e.target.value})}
                >
                  <option value="">Select Option</option>
                  <option value="Own House">Own House</option>
                  <option value="Rented House">Rented House</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Collateral / Assets Description</label>
              <input 
                type="text"
                placeholder="e.g. Land (1 Acre), tractor, 2 cows"
                className="premium-input"
                value={values.assets} onChange={e => setValues({...values, assets: e.target.value})}
              />
            </div>
          </fieldset>
        )}

        {/* Step 5: Document & Camera Capture */}
        {(step === null || step === 5) && (
          <fieldset className="border border-slate-100 p-5 rounded-2xl space-y-4 bg-slate-50/50 shadow-sm animate-fade-in">
            <legend className="text-xs font-bold text-violet-600 px-3 py-0.5 rounded-full bg-violet-50 border border-violet-100 flex items-center gap-1">
              <Camera size={12} /> Document & Photo Capture
            </legend>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Photo Column */}
              <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-150 shadow-xs space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Customer Photograph</span>
                
                {values.customerPhoto ? (
                  <div className="relative w-32 h-32 rounded-full border-2 border-violet-100 overflow-hidden shadow-inner group">
                    <img src={values.customerPhoto} alt="Customer Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setValues({...values, customerPhoto: ''})}
                      className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs cursor-pointer"
                    >
                      Retake Photo
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-50 border border-dashed border-slate-350 flex flex-col items-center justify-center text-slate-400">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">No Image</span>
                  </div>
                )}
                
                <label className="bg-violet-50 hover:bg-violet-100 text-violet-750 border border-violet-100 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider">
                  Capture Customer Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="user" 
                    className="hidden" 
                    onChange={(e) => handleImageCapture(e, 'customerPhoto', setValues, values)} 
                  />
                </label>
              </div>

              {/* Aadhaar Card Column */}
              <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-150 shadow-xs space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Aadhaar Card Document</span>
                
                {values.aadhaarPhoto ? (
                  <div className="relative w-48 h-28 rounded-xl border-2 border-violet-100 overflow-hidden shadow-inner group">
                    <img src={values.aadhaarPhoto} alt="Aadhaar Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setValues({...values, aadhaarPhoto: ''})}
                      className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs cursor-pointer"
                    >
                      Retake Aadhaar
                    </button>
                  </div>
                ) : (
                  <div className="w-48 h-28 rounded-xl bg-slate-50 border border-dashed border-slate-350 flex flex-col items-center justify-center text-slate-400">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">No Document</span>
                  </div>
                )}
                
                <label className="bg-violet-50 hover:bg-violet-100 text-violet-755 border border-violet-100 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider">
                  Capture Aadhaar Card
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={(e) => handleImageCapture(e, 'aadhaarPhoto', setValues, values)} 
                  />
                </label>
              </div>
            </div>
          </fieldset>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Detail Hub View */}
      {selectedGroup ? (
        <div className="space-y-6 animate-fade-in">
          {/* Header Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedGroup(null)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl text-slate-650 transition cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="text-left">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{selectedGroup.name}</h1>
                  {(user?.role === 'Admin' || user?.role === 'Employee') && (
                    <button 
                      onClick={handleRenameGroup}
                      className="p-1 text-slate-400 hover:text-violet-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                      title="Rename Group"
                    >
                      <Edit3 size={15} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span>Joint Liability Microfinance Group administrative portfolio</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:inline"></span>
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    Roster Collector: {selectedGroup.collector ? (
                      <span className="text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100 font-bold uppercase tracking-wider text-[9px]">
                        {selectedGroup.collector.name}
                      </span>
                    ) : (
                      <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-bold uppercase tracking-wider text-[9px]">
                        Unassigned
                      </span>
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
              {(user?.role === 'Admin' || user?.role === 'Employee') && (
                <button 
                  onClick={handleOpenAddMemberModal}
                  className="flex-1 lg:flex-initial bg-violet-50 hover:bg-violet-100 text-violet-700 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition font-bold text-xs border border-violet-100 shadow-sm shadow-violet-500/5 cursor-pointer"
                >
                  <UserPlus size={16} /> Add Member
                </button>
              )}
              <button 
                onClick={handleOpenCollectionSheet}
                className="flex-1 lg:flex-initial bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition font-bold text-xs shadow-md shadow-violet-500/15 cursor-pointer"
              >
                <Layers size={16} /> Collection Sheet
              </button>
              {user?.role === 'Admin' && (
                <>
                  <button 
                    onClick={() => setShowDisburseLoanModal(true)}
                    className="flex-1 lg:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition font-bold text-xs shadow-md shadow-emerald-500/15 cursor-pointer"
                  >
                    <CreditCard size={16} /> Disburse Loan
                  </button>
                  <button 
                    onClick={() => handleDeleteGroup(selectedGroup._id, selectedGroup.name)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition font-bold text-xs border border-rose-100 cursor-pointer"
                  >
                    <Trash2 size={16} /> Delete Group
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Group Stats Roster */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-xl border border-violet-100">
                <Users size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Group Size</p>
                <h3 className="text-lg font-black text-slate-800 mt-1">{selectedGroup.members?.length || 0} Members</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <CreditCard size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Credits</p>
                <h3 className="text-lg font-black text-slate-800 mt-1">
                  {selectedGroupLoans.filter(l => l.status === 'Active').length} Loans Active
                </h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Repayments Status</p>
                <h3 className="text-lg font-black text-slate-800 mt-1">
                  {selectedGroupLoans.filter(l => l.status === 'Completed').length} Fully Settled
                </h3>
              </div>
            </div>
          </div>

          {/* Group Details Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Members List Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-violet-600" /> Borrower Directory ({selectedGroup.members?.length || 0})
                </h2>
              </div>

              <div className="space-y-4">
                {selectedGroup.members?.map((member) => {
                  const isExpanded = !!expandedCards[member._id];
                  return (
                    <div 
                      key={member._id} 
                      className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-premium hover:shadow-md"
                    >
                      {/* Condensed Summary Row */}
                      <div 
                        onClick={() => toggleCardExpansion(member._id)}
                        className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50/40 select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden border border-slate-100">
                            {member.customerPhoto ? (
                              <img src={member.customerPhoto} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              member.name ? member.name.charAt(0).toUpperCase() : 'B'
                            )}
                          </div>
                          <div className="text-left">
                            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 flex-wrap">
                              {member.name}
                              {member.isVerified ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                                  <UserCheck size={9} /> KYC Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">
                                  <Clock size={9} /> KYC Pending
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Phone size={12} className="text-slate-400" /> {member.phone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end" onClick={e => e.stopPropagation()}>
                          {/* Render credit score gauge */}
                          {renderCreditGauge(member.creditScore || 75, member.creditGrade || 'B')}

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => toggleCardExpansion(member._id)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
                              title="Toggle Details"
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details Panel */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/40 p-5 space-y-4 animate-fade-in text-left">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Personal Card */}
                            <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs space-y-2 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KYC Profile</span>
                                <div className="space-y-1.5 text-xs text-slate-700 mt-2">
                                  <p><strong>Father:</strong> {member.fatherName || 'N/A'}</p>
                                  <p><strong>Mother:</strong> {member.motherName || 'N/A'}</p>
                                  <p><strong>Spouse:</strong> {member.spouseName || 'N/A'}</p>
                                  <p><strong>Aadhaar:</strong> {member.aadhaarNumber || 'N/A'}</p>
                                </div>
                              </div>
                              
                              {/* Photos section */}
                              {(member.customerPhoto || member.aadhaarPhoto) && (
                                <div className="flex gap-3 pt-3 border-t border-slate-100 mt-3">
                                  {member.customerPhoto && (
                                    <div className="text-center">
                                      <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">Photo</p>
                                      <img 
                                        src={member.customerPhoto} 
                                        alt="Customer" 
                                        onClick={(e) => { e.stopPropagation(); window.open(member.customerPhoto, '_blank'); }}
                                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-85 transition"
                                      />
                                    </div>
                                  )}
                                  {member.aadhaarPhoto && (
                                    <div className="text-center">
                                      <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">Aadhaar</p>
                                      <img 
                                        src={member.aadhaarPhoto} 
                                        alt="Aadhaar" 
                                        onClick={(e) => { e.stopPropagation(); window.open(member.aadhaarPhoto, '_blank'); }}
                                        className="w-16 h-12 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-85 transition"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Financial Card */}
                            <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs space-y-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Financial Ratios</span>
                              <div className="space-y-1.5 text-xs text-slate-700">
                                <p><strong>Occupation:</strong> {member.occupation || 'N/A'}</p>
                                <p><strong>Monthly Income:</strong> ₹{(member.monthlyIncome || 0).toLocaleString()}</p>
                                <p><strong>Home Status:</strong> {member.homeType || 'N/A'}</p>
                                <p><strong>Family:</strong> {member.totalChildren || 0} Children ({member.childrenNames || 'None'})</p>
                              </div>
                            </div>

                            {/* Location & Collateral Card */}
                            <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs space-y-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assets & Location</span>
                              <div className="space-y-1.5 text-xs text-slate-700">
                                <p className="flex items-start gap-1">
                                  <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                                  <span>{member.address}</span>
                                </p>
                                <p><strong>Permanent:</strong> {member.permanentAddress || member.address}</p>
                                <p><strong>Assets:</strong> {member.assets || 'None listed'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Action Bar */}
                          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => handleToggleVerification(member)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                member.isVerified 
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100'
                              }`}
                            >
                              <UserCheck size={14} />
                              {member.isVerified ? 'Revoke Verification' : 'Verify KYC Documents'}
                            </button>
                            
                            {(user?.role === 'Admin' || user?.role === 'Employee') && (
                              <button
                                onClick={() => handleOpenEditCustomerModal(member)}
                                className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-150 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 size={14} /> Edit Profile
                              </button>
                            )}
                            {user?.role === 'Admin' && (
                              <button
                                onClick={() => handleRemoveMember(member._id)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={14} /> Remove Member
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!selectedGroup.members || selectedGroup.members.length === 0) && (
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center text-slate-500 font-medium">
                    No members inside this group. Click 'Add Member' to register individuals.
                  </div>
                )}
              </div>
            </div>

            {/* Group Loans panel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-600" /> Group Loans Ledger
                </h2>
              </div>

              <div className="space-y-3.5">
                {selectedGroupLoans.map((loan) => (
                  <div key={loan._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3.5 hover:border-violet-200 hover:shadow-md transition-all duration-300 text-left">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Disbursed Principal</span>
                        <h4 className="text-lg font-black text-slate-800 mt-0.5">₹{loan.amount.toLocaleString('en-IN')}</h4>
                      </div>
                      
                      {loan.status === 'Active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Completed
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 font-bold block uppercase tracking-wider text-[8px]">
                          {loan.paymentFrequency === 'Weekly' ? 'Weekly Kist' : 'Monthly EMI'}
                        </span>
                        <span className="font-extrabold text-slate-750">₹{loan.emiAmount}/{loan.paymentFrequency === 'Weekly' ? 'wk' : 'mo'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block uppercase tracking-wider text-[8px]">Rate & Tenure</span>
                        <span className="font-extrabold text-slate-750">
                          {loan.interestRate}% @ {loan.duration} {loan.paymentFrequency === 'Weekly' ? 'wks' : 'mos'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold pt-0.5">
                      <Calendar size={12} className="text-slate-400" />
                      <span>Issued: {new Date(loan.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}

                {selectedGroupLoans.length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-150 p-8 text-center text-slate-500 font-medium">
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
            <div className="text-left">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Groups & Customers</h1>
              <p className="text-sm text-slate-500 mt-1">Manage borrower credit ratings, verify KYC documents, and construct joint liability groups</p>
            </div>
            
            {(user?.role === 'Admin' || user?.role === 'Employee') && (
              <div className="flex gap-2.5 w-full sm:w-auto">
                <button 
                  onClick={handleOpenGroupModal}
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition font-bold text-xs shadow-md shadow-violet-500/15 cursor-pointer"
                >
                  <Users size={16} /> Create Group
                </button>
                <button 
                  onClick={() => { setShowModal(true); setError(''); setFormData(initialCustomerState); setCustomerFormStep(1); }}
                  className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition font-bold text-xs border border-slate-250 shadow-xs cursor-pointer"
                >
                  <Plus size={16} /> Add Customer
                </button>
              </div>
            )}
          </div>

          {/* Premium HSL Tabs Controls */}
          <div className="flex bg-white px-4 rounded-2xl border border-slate-100 shadow-sm w-fit">
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-5 py-4 font-bold text-xs transition-all border-b-2 flex items-center gap-2 -mb-px uppercase tracking-wider cursor-pointer ${
                activeTab === 'groups'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-850'
              }`}
            >
              <Layers size={15} /> Joint Liability Groups ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-5 py-4 font-bold text-xs transition-all border-b-2 flex items-center gap-2 -mb-px uppercase tracking-wider cursor-pointer ${
                activeTab === 'customers'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-slate-500 hover:text-slate-850'
              }`}
            >
              <Users size={15} /> Customers Directory ({customers.length})
            </button>
          </div>

          {/* Tab 1: Joint Liability Groups */}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Search size={16} />
                </span>
                <input 
                  type="text"
                  placeholder="Search groups by name..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-350 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-xs font-semibold bg-white text-slate-800"
                  value={groupSearchQuery}
                  onChange={e => setGroupSearchQuery(e.target.value)}
                />
              </div>

              {loadingGroups ? (
                <div className="text-center py-12 text-slate-400 font-semibold animate-pulse">Loading Microfinance groups...</div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Group Name</th>
                          <th className="px-6 py-4">Members</th>
                          <th className="px-6 py-4">Capacity</th>
                          <th className="px-6 py-4">Roster Collector</th>
                          <th className="px-6 py-4">Disbursed Date</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredGroups.map((group) => (
                          <tr key={group._id} className="hover:bg-slate-50/60 transition cursor-pointer" onClick={() => handleSelectGroup(group)}>
                            <td className="px-6 py-4 font-black text-slate-800 flex items-center gap-2.5 text-sm">
                              <span className="p-1.5 bg-violet-50 text-violet-600 rounded-lg border border-violet-100">
                                <Layers size={14} />
                              </span>
                              {group.name}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1.5 max-w-sm md:max-w-md" onClick={e => e.stopPropagation()}>
                                {group.members?.map((member) => (
                                  <span 
                                    key={member._id} 
                                    onClick={() => handleOpenEditCustomerModal(member)}
                                    className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                                  >
                                    {member.name}
                                  </span>
                                ))}
                                {(!group.members || group.members.length === 0) && (
                                  <span className="text-slate-400 text-xs italic font-medium">Empty group</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-700 font-bold text-xs">{group.members?.length || 0} Members</td>
                            <td className="px-6 py-4">
                              {group.collector ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100" onClick={e => e.stopPropagation()}>
                                  {group.collector.name}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200" onClick={e => e.stopPropagation()}>
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
                                  className="text-violet-700 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-violet-100 cursor-pointer shadow-xs"
                                >
                                  Manage
                                  <ChevronRight size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredGroups.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium italic bg-white">No microfinance groups matched your search.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Customers Directory */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Search size={16} />
                </span>
                <input 
                  type="text"
                  placeholder="Search borrowers by name, phone..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-350 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-xs font-semibold bg-white text-slate-800"
                  value={customerSearchQuery}
                  onChange={e => setCustomerSearchQuery(e.target.value)}
                />
              </div>

              {loadingCustomers ? (
                <div className="text-center py-12 text-slate-400 font-semibold animate-pulse">Syncing customer records...</div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Borrower Name</th>
                          <th className="px-6 py-4">Phone / Contact</th>
                          <th className="px-6 py-4">KYC Status</th>
                          <th className="px-6 py-4">Credit Score</th>
                          <th className="px-6 py-4">Address</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCustomers.map((c) => (
                          <tr key={c._id} className="hover:bg-slate-50/60 transition cursor-pointer" onClick={() => handleOpenEditCustomerModal(c)}>
                            <td className="px-6 py-4 font-black text-slate-800 flex items-center gap-2.5 text-sm">
                              <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden border border-slate-100">
                                {c.customerPhoto ? (
                                  <img src={c.customerPhoto} alt={c.name} className="w-full h-full object-cover" />
                                ) : (
                                  c.name ? c.name.charAt(0).toUpperCase() : 'B'
                                )}
                              </div>
                              {c.name}
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-bold text-xs">{c.phone}</td>
                            <td className="px-6 py-4">
                              {c.isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100" onClick={e => { e.stopPropagation(); handleToggleVerification(c); }}>
                                  <Check size={11} /> Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100" onClick={e => { e.stopPropagation(); handleToggleVerification(c); }}>
                                  <Clock size={11} /> Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-black border ${
                                c.creditGrade === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                c.creditGrade === 'B' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                c.creditGrade === 'C' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {c.creditScore} ({c.creditGrade || 'B'})
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs font-semibold max-w-xs truncate">{c.address}</td>
                            <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <Link 
                                  to={`/customers/${c._id}`}
                                  className="text-indigo-750 hover:bg-indigo-50 p-1.5 rounded-lg transition border border-transparent hover:border-indigo-100 cursor-pointer"
                                  title="View Full Profile"
                                >
                                  <ChevronRight size={15} />
                                </Link>
                                <button 
                                  onClick={() => handleOpenEditCustomerModal(c)}
                                  className="text-violet-750 hover:bg-violet-50 p-1.5 rounded-lg transition border border-transparent hover:border-violet-100 cursor-pointer"
                                  title="Edit Profile"
                                >
                                  <Edit3 size={15} />
                                </button>
                                {user?.role === 'Admin' && (
                                  <button 
                                    onClick={() => handleDeleteCustomer(c._id, c.name)}
                                    className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition border border-transparent hover:border-rose-100 cursor-pointer"
                                    title="Delete Profile"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredCustomers.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium italic bg-white">No customers found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-4xl overflow-hidden flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Register New Borrower</h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Provide the comprehensive details for microfinance enrollment</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Stepper Progress Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex overflow-x-auto gap-4 md:justify-between items-center text-xs font-semibold text-slate-500 scrollbar-none">
              {[
                { step: 1, label: 'Identity' },
                { step: 2, label: 'Address' },
                { step: 3, label: 'Family' },
                { step: 4, label: 'Financial' },
                { step: 5, label: 'Documents' }
              ].map(s => {
                const isActive = customerFormStep === s.step;
                const isCompleted = customerFormStep > s.step;
                return (
                  <div key={s.step} className="flex items-center gap-2 shrink-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold text-[10px] transition-all duration-300 ${
                      isActive ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/25 scale-110' :
                      isCompleted ? 'bg-emerald-50 border-emerald-250 text-emerald-600' :
                      'bg-white border-slate-200 text-slate-400'
                    }`}>
                      {isCompleted ? <Check size={10} strokeWidth={3} /> : s.step}
                    </span>
                    <span className={`transition-all duration-300 ${isActive ? 'text-violet-600 font-bold' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                    {s.step < 5 && (
                      <span className="hidden md:inline text-slate-350 font-normal font-mono">➔</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-150 text-rose-700 rounded-xl text-xs font-bold text-left animate-fade-in flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
              
              <form onSubmit={handleCreateCustomer} className="space-y-6">
                {renderCustomerFieldsForm(formData, setFormData, customerFormStep)}

                <div className="pt-5 border-t border-slate-100 mt-6 flex gap-3.5 bg-slate-50 -mx-6 -mb-6 p-6">
                  {customerFormStep === 1 ? (
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="w-1/2 bg-white text-slate-700 border border-slate-250 p-3 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => { setError(''); setCustomerFormStep(prev => prev - 1); }}
                      className="w-1/2 bg-white text-slate-700 border border-slate-250 p-3 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Previous
                    </button>
                  )}

                  {customerFormStep < 5 ? (
                    <button 
                      type="button" 
                      onClick={handleNextStep}
                      className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-3 rounded-xl font-bold transition shadow-md shadow-violet-500/15 cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Next
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-3 rounded-xl font-bold transition shadow-md shadow-violet-500/15 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
                    >
                      {loading ? 'Creating Account...' : 'Disburse Profile Registration'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Unified Group Builder Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-4xl overflow-hidden flex flex-col h-[95vh] sm:h-auto sm:max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Unified Customer Group Builder</h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Construct a Joint Liability Group and register any new members concurrently</p>
              </div>
              <button 
                onClick={() => setShowGroupModal(false)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stepper Progress Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex gap-4 items-center text-xs font-semibold text-slate-500">
              {[
                { step: 1, label: 'Group Details' },
                { step: 2, label: 'Members Roster' }
              ].map(s => {
                const isActive = groupFormStep === s.step;
                const isCompleted = groupFormStep > s.step;
                return (
                  <div key={s.step} className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold text-[10px] transition-all duration-300 ${
                      isActive ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/25 scale-110' :
                      isCompleted ? 'bg-emerald-50 border-emerald-250 text-emerald-600' :
                      'bg-white border-slate-200 text-slate-400'
                    }`}>
                      {isCompleted ? <Check size={10} strokeWidth={3} /> : s.step}
                    </span>
                    <span className={`transition-all duration-300 ${isActive ? 'text-violet-600 font-bold' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                    {s.step < 2 && (
                      <span className="text-slate-350 font-normal font-mono">➔</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {groupError && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-150 text-rose-700 rounded-xl text-xs font-bold text-left animate-fade-in flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{groupError}</span>
                </div>
              )}
              {groupSuccess && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-xl text-xs font-bold text-left animate-fade-in flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>{groupSuccess}</span>
                </div>
              )}
              
              <form onSubmit={handleCreateGroup} className="space-y-6">
                {/* Step 1: Group Basics */}
                {groupFormStep === 1 && (
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4 text-left animate-fade-in">
                    <h3 className="text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Layers size={14} /> Basic Group Details
                    </h3>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Group Recipient Name *</label>
                      <input 
                        type="text" required
                        placeholder="e.g. Radhe Mahila Bachat Gat / Bharat Sangha #5"
                        className="w-full p-2.5 border border-slate-350 rounded-xl text-slate-850 focus:ring-2 focus:ring-violet-500 focus:outline-none bg-white text-xs font-semibold"
                        value={groupName} onChange={e => setGroupName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Group Members Roster */}
                {groupFormStep === 2 && (
                  <div className="space-y-4 text-left animate-fade-in">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
                        <Users size={14} className="text-violet-600" /> Group Members Roster
                      </h3>
                      <button 
                        type="button" 
                        onClick={handleAddMemberRow}
                        className="bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold border border-violet-100 shadow-xs cursor-pointer uppercase tracking-wider"
                      >
                        <Plus size={12} /> Add Member Row
                      </button>
                    </div>

                    <div className="space-y-5">
                      {groupMembers.map((member, index) => (
                        <div key={index} className="border border-slate-150 rounded-2xl p-5 bg-slate-50/20 relative space-y-4 shadow-sm animate-scale-up">
                          {/* Member index & Remove row button */}
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Member Profile #{index + 1}</span>
                            {groupMembers.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => handleRemoveMemberRow(index)}
                                className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition border border-transparent hover:border-rose-100 cursor-pointer"
                                title="Delete Member Row"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          {/* Existing vs New radio picker */}
                          <div className="flex gap-4 items-center">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Borrower Origin:</label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                                <input 
                                  type="radio" 
                                  className="w-3.5 h-3.5 text-violet-600 focus:ring-violet-500 border-slate-350 cursor-pointer"
                                  checked={member.isExisting === true}
                                  onChange={() => handleMemberChange(index, 'isExisting', true)}
                                />
                                Select Existing Customer
                              </label>
                              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                                <input 
                                  type="radio" 
                                  className="w-3.5 h-3.5 text-violet-600 focus:ring-violet-500 border-slate-350 cursor-pointer"
                                  checked={member.isExisting === false}
                                  onChange={() => handleMemberChange(index, 'isExisting', false)}
                                />
                                Register New Borrower
                              </label>
                            </div>
                          </div>

                          {/* Roster fields container */}
                          {member.isExisting ? (
                            <div className="bg-white p-4 rounded-xl border border-slate-150">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Existing Customer Profile *</label>
                              <select 
                                required
                                className="premium-select"
                                value={member.customerId} 
                                onChange={e => handleMemberChange(index, 'customerId', e.target.value)}
                              >
                                <option value="">Select a registered borrower</option>
                                {customers.map(c => (
                                  <option key={c._id} value={c._id}>
                                    {c.name} (📞 {c.phone} | UIDAI Aadhaar: {c.aadhaarNumber || 'None'} | Rating: {c.creditGrade})
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Nested step indicator for this new borrower */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100/60 p-3.5 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  New Borrower Profile Step {member.memberStep || 1} of 5:
                                </span>
                                <span className="text-[10px] font-black text-violet-650 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  {member.memberStep === 2 ? 'Address Details' : 
                                   member.memberStep === 3 ? 'Family Relations' : 
                                   member.memberStep === 4 ? 'Financial Profile' : 
                                   member.memberStep === 5 ? 'KYC Documents' : 'Personal Identity'}
                                </span>
                              </div>

                              {renderCustomerFieldsForm(member, (val) => {
                                const updated = [...groupMembers];
                                updated[index] = { ...member, ...val };
                                setGroupMembers(updated);
                              }, member.memberStep || 1)}

                              {/* Inner Step Controls */}
                              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-2">
                                {(member.memberStep || 1) > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...groupMembers];
                                      updated[index].memberStep = (member.memberStep || 1) - 1;
                                      setGroupMembers(updated);
                                    }}
                                    className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold transition uppercase tracking-wider cursor-pointer"
                                  >
                                    Prev Step
                                  </button>
                                )}
                                {(member.memberStep || 1) < 5 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const curStep = member.memberStep || 1;
                                      if (curStep === 1) {
                                        if (!member.name?.trim()) { alert(`Member #${index + 1}: Name is required`); return; }
                                        if (!member.phone?.trim()) { alert(`Member #${index + 1}: Phone is required`); return; }
                                        if (!member.email?.trim()) { alert(`Member #${index + 1}: Email is required`); return; }
                                        if (!member.emailVerified) { alert(`Member #${index + 1}: Please verify email first`); return; }
                                      } else if (curStep === 2) {
                                        if (!member.address?.trim()) { alert(`Member #${index + 1}: Current Address is required`); return; }
                                      }
                                      const updated = [...groupMembers];
                                      updated[index].memberStep = curStep + 1;
                                      setGroupMembers(updated);
                                    }}
                                    className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-[10px] font-bold transition uppercase tracking-wider cursor-pointer"
                                  >
                                    Next Step
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1.5 px-3 py-1.5 border border-emerald-100 bg-emerald-50 rounded-lg shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Registration Ready
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-5 border-t border-slate-100 mt-6 flex gap-3.5 bg-slate-50 -mx-6 -mb-6 p-6">
                  {groupFormStep === 1 ? (
                    <button 
                      type="button" 
                      onClick={() => setShowGroupModal(false)}
                      className="w-1/2 bg-white text-slate-700 border border-slate-250 p-3 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => { setGroupError(''); setGroupFormStep(1); }}
                      className="w-1/2 bg-white text-slate-700 border border-slate-250 p-3 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Previous
                    </button>
                  )}

                  {groupFormStep === 1 ? (
                    <button 
                      type="button" 
                      onClick={handleNextGroupStep}
                      className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-3 rounded-xl font-bold transition shadow-md shadow-violet-500/15 cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Next
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      disabled={groupLoading}
                      className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-3 rounded-xl font-bold transition shadow-md shadow-violet-500/15 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
                    >
                      {groupLoading ? 'Building Group...' : 'Save & Disburse Joint Group'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Details Modal */}
      {showEditMemberModal && editingCustomer && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Edit Borrower Profile</h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Modify individual fields for <strong className="text-violet-600">{editingCustomer.name}</strong></p>
              </div>
              <button 
                onClick={() => { setShowEditMemberModal(false); setEditingCustomer(null); }} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <form onSubmit={handleEditCustomerSubmit} className="space-y-6">
                {renderCustomerFieldsForm(editCustomerFormData, setEditCustomerFormData)}

                <div className="pt-5 border-t border-slate-100 mt-6 flex gap-3.5 bg-slate-50 -mx-6 -mb-6 p-6">
                  <button 
                    type="button" 
                    onClick={() => { setShowEditMemberModal(false); setEditingCustomer(null); }}
                    className="w-1/2 bg-white text-slate-700 border border-slate-250 p-3 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-3 rounded-xl font-bold transition shadow-md shadow-violet-500/15 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Member to Group Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Add Group Member</h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Integrate a borrower into group: <strong className="text-violet-600">{selectedGroup.name}</strong></p>
              </div>
              <button 
                onClick={() => setShowAddMemberModal(false)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stepper Progress Header for New Member */}
            {addMemberType === 'new' && (
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex overflow-x-auto gap-4 md:justify-between items-center text-xs font-semibold text-slate-500 scrollbar-none">
                {[
                  { step: 1, label: 'Identity' },
                  { step: 2, label: 'Address' },
                  { step: 3, label: 'Family' },
                  { step: 4, label: 'Financial' },
                  { step: 5, label: 'Documents' }
                ].map(s => {
                  const isActive = addMemberFormStep === s.step;
                  const isCompleted = addMemberFormStep > s.step;
                  return (
                    <div key={s.step} className="flex items-center gap-2 shrink-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold text-[10px] transition-all duration-300 ${
                        isActive ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/25 scale-110' :
                        isCompleted ? 'bg-emerald-50 border-emerald-250 text-emerald-600' :
                        'bg-white border-slate-200 text-slate-400'
                      }`}>
                        {isCompleted ? <Check size={10} strokeWidth={3} /> : s.step}
                      </span>
                      <span className={`transition-all duration-300 ${isActive ? 'text-violet-600 font-bold' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                      {s.step < 5 && (
                        <span className="hidden md:inline text-slate-355 font-normal font-mono">➔</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="p-6 flex-1 overflow-y-auto">
              <form onSubmit={handleAddMemberSubmit} className="space-y-6">
                {/* Radio selection */}
                <div className="flex gap-6 items-center justify-start text-left border-b border-slate-100 pb-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Borrower Type:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        className="w-3.5 h-3.5 text-violet-600 focus:ring-violet-500 border-slate-350 cursor-pointer"
                        checked={addMemberType === 'existing'}
                        onChange={() => setAddMemberType('existing')}
                      />
                      Existing Profile
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        className="w-3.5 h-3.5 text-violet-600 focus:ring-violet-500 border-slate-350 cursor-pointer"
                        checked={addMemberType === 'new'}
                        onChange={() => setAddMemberType('new')}
                      />
                      Register New Profile
                    </label>
                  </div>
                </div>

                {addMemberType === 'existing' ? (
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 text-left">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Registered Customer Profile *</label>
                    <select 
                      required
                      className="w-full p-3 border border-slate-355 rounded-xl text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-none bg-white text-xs font-semibold"
                      value={addMemberCustomerId} 
                      onChange={e => setAddMemberCustomerId(e.target.value)}
                    >
                      <option value="">Choose a registered borrower</option>
                      {availableExistingCustomers.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.name} (📞 {c.phone} | Aadhaar: {c.aadhaarNumber || 'None'} | Grade: {c.creditGrade})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  renderCustomerFieldsForm(addMemberFormData, setAddMemberFormData, addMemberFormStep)
                )}

                <div className="pt-5 border-t border-slate-100 mt-6 flex gap-3.5 bg-slate-50 -mx-6 -mb-6 p-6">
                  {addMemberType === 'existing' || addMemberFormStep === 1 ? (
                    <button 
                      type="button" 
                      onClick={() => setShowAddMemberModal(false)}
                      className="w-1/2 bg-white text-slate-700 border border-slate-250 p-3 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => { setError(''); setAddMemberFormStep(prev => prev - 1); }}
                      className="w-1/2 bg-white text-slate-700 border border-slate-250 p-3 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Previous
                    </button>
                  )}

                  {addMemberType === 'new' && addMemberFormStep < 5 ? (
                    <button 
                      type="button" 
                      onClick={handleNextAddMemberStep}
                      className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-3 rounded-xl font-bold transition shadow-md shadow-violet-500/15 cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Next
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-3 rounded-xl font-bold transition shadow-md shadow-violet-500/15 cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Confirm Member Addition
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Group Loan Modal */}
      {showDisburseLoanModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Disburse Group Loan</h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Issue credit capital under joint liability to group: <strong className="text-violet-600">{selectedGroup.name}</strong></p>
              </div>
              <button 
                onClick={() => setShowDisburseLoanModal(false)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleDisburseLoanSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Principal Amount (₹) *</label>
                    <input 
                      type="number" required min="1"
                      className="w-full p-2.5 border border-slate-350 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      value={disburseLoanFormData.amount} 
                      onChange={e => setDisburseLoanFormData({...disburseLoanFormData, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Interest (% p.a.) *</label>
                    <input 
                      type="number" required min="0" step="0.1"
                      className="w-full p-2.5 border border-slate-350 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      value={disburseLoanFormData.interestRate} 
                      onChange={e => setDisburseLoanFormData({...disburseLoanFormData, interestRate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">EMI Frequency</label>
                    <select
                      className="w-full p-2.5 border border-slate-355 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none bg-white"
                      value={disburseLoanFormData.paymentFrequency}
                      onChange={e => setDisburseLoanFormData({...disburseLoanFormData, paymentFrequency: e.target.value})}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly (Kist)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Disbursement Date</label>
                    <input 
                      type="date"
                      className="w-full p-2.5 border border-slate-350 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      value={disburseLoanFormData.startDate} 
                      onChange={e => setDisburseLoanFormData({...disburseLoanFormData, startDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Capital Tenure ({disburseLoanFormData.paymentFrequency === 'Weekly' ? 'Weeks' : 'Months'}) *
                  </label>
                  <input 
                    type="number" required min="1"
                    className="w-full p-2.5 border border-slate-350 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    value={disburseLoanFormData.duration} 
                    onChange={e => setDisburseLoanFormData({...disburseLoanFormData, duration: e.target.value})}
                  />
                </div>

                <div className="pt-5 border-t border-slate-100 mt-6 flex gap-3.5 bg-slate-50 -mx-6 -mb-6 p-6">
                  <button 
                    type="button" 
                    onClick={() => setShowDisburseLoanModal(false)}
                    className="w-1/2 bg-white text-slate-700 border border-slate-250 p-3 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-3 rounded-xl font-bold transition shadow-md shadow-emerald-500/15 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Issue Loan Capital
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Group Collection Sheet Modal */}
      {showCollectionModal && collectionSheetData && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Layers size={20} className="text-violet-600" /> Digital Collection Sheet
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Bulk recover joint liability installments for group: <strong className="text-violet-600">{selectedGroup.name}</strong></p>
              </div>
              <button 
                onClick={() => setShowCollectionModal(false)} 
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition bg-white border border-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Sheet Worksheet */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {collectionSheetData.activeLoans.length === 0 ? (
                <div className="bg-slate-50 p-8 rounded-2xl border border-dashed border-slate-350 text-center text-slate-500 text-sm font-semibold italic">
                  This Joint Liability Group has no active outstanding loans requiring collections.
                </div>
              ) : (
                <form onSubmit={handleCollectionSubmit} className="space-y-6">
                  {/* Ledger Table */}
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left whitespace-nowrap border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Borrower Name</th>
                          {collectionSheetData.activeLoans.map(loan => (
                            <th key={loan.loanId} className="px-6 py-4">
                              <span>Loan ₹{loan.amount.toLocaleString()}</span>
                              <span className="text-[8px] text-slate-400 font-black block mt-1">EMI: ₹{loan.nextInstallment.emiAmount} | Share: ₹{loan.nextInstallment.sharePerMember}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {collectionSheetData.members.map(member => (
                          <tr key={member._id} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 font-black text-slate-800 text-xs flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-[10px]">
                                {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                              </div>
                              {member.name}
                            </td>
                            {collectionSheetData.activeLoans.map(loan => {
                              const isChecked = !!collectionCheckboxState[member._id]?.[loan.loanId];
                              return (
                                <td key={loan.loanId} className="px-6 py-4">
                                  <label 
                                    onClick={() => handleCollectionCheckboxToggle(member._id, loan.loanId)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-extrabold select-none cursor-pointer w-fit transition-all duration-200 ${
                                      isChecked 
                                        ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-350'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox" 
                                      className="sr-only"
                                      checked={isChecked}
                                      onChange={() => {}} // Controlled by label click
                                    />
                                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                      isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                                    }`}>
                                      {isChecked && <Check size={10} strokeWidth={4} />}
                                    </span>
                                    <span>₹{loan.nextInstallment.sharePerMember.toLocaleString()} Paid</span>
                                  </label>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Board */}
                  <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-150 space-y-4 text-left">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Collections Recovery Summary</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {collectionSheetData.activeLoans.map(loan => {
                        const paidMembersCount = collectionSheetData.members.filter(m => 
                          collectionCheckboxState[m._id]?.[loan.loanId]
                        ).length;
                        const recoveryAmount = paidMembersCount * loan.nextInstallment.sharePerMember;
                        const totalEMI = loan.nextInstallment.emiAmount;

                        return (
                          <div key={loan.loanId} className="bg-white p-4 rounded-xl border border-slate-150 shadow-xs text-left space-y-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Capital Principal: ₹{loan.amount.toLocaleString()}</span>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-650 font-bold">Recovered Amount:</span>
                              <span className="font-extrabold text-emerald-600">₹{recoveryAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-650 font-bold">Collection efficiency:</span>
                              <span className="font-extrabold text-slate-800">{paidMembersCount} / {collectionSheetData.members.length} members</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(paidMembersCount / collectionSheetData.members.length) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Block */}
                  <div className="pt-5 border-t border-slate-100 mt-6 flex gap-3.5 bg-slate-50 -mx-6 -mb-6 p-6">
                    <button 
                      type="button" 
                      onClick={() => setShowCollectionModal(false)}
                      className="w-1/2 bg-white text-slate-700 border border-slate-250 p-3 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-xs uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={submittingCollection}
                      className="w-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-3 rounded-xl font-bold transition shadow-md shadow-violet-500/15 cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
                    >
                      {submittingCollection ? 'Submitting Ledger...' : 'Commit Collections Recovery'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
