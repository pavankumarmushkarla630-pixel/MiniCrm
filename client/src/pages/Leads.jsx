import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getLeads, createLead } from '../store/leadsSlice';
import LeadTable from '../components/LeadTable';
import LeadDrawer from '../components/LeadDrawer';
import Toast from '../components/Toast';
import { Search, Download, Plus } from 'lucide-react';
import Topbar from '../components/Topbar';

const Leads = () => {
  const dispatch = useDispatch();
  const { leads, isLoading, isSuccess } = useSelector((state) => state.leads);
  
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [newLeadData, setNewLeadData] = useState({ name: '', email: '', company: '', source: 'Website', status: 'New', priority: 'Cold' });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const queryParts = [];
    if (filterStatus) queryParts.push(`status=${filterStatus}`);
    if (debouncedSearch) queryParts.push(`search=${debouncedSearch}`);
    queryParts.push(`sort=${sortField}:${sortOrder}`);
    
    dispatch(getLeads(queryParts.join('&')));
  }, [dispatch, filterStatus, debouncedSearch, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportCSV = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/leads/export/csv`;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    await dispatch(createLead(newLeadData));
    setIsDrawerOpen(false);
    setShowToast(true);
    setNewLeadData({ name: '', email: '', company: '', source: 'Website', status: 'New', priority: 'Cold' });
    dispatch(getLeads()); // refresh
  };

  const filters = ['All', 'New', 'Contacted', 'Negotiating', 'Converted', 'Lost'];

  return (
    <>
      {/* We inject our own Topbar overrides here or let layout handle it. Let layout handle.
          Wait! The layout defines Topbar but doesn't pass onAddLead to Topbar correctly from here.
          Since Topbar is in Layout, we can use a Portal or a global state, but for simplicity, we just use local button here for now.
      */}
      <div className='flex flex-col space-y-4'>
        
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4'>
          <div className='flex items-center gap-2 overflow-x-auto pb-2 md:pb-0'>
            {filters.map(f => (
              <button 
                key={f} 
                onClick={() => setFilterStatus(f === 'All' ? '' : f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  (filterStatus === f || (f === 'All' && !filterStatus))
                  ? 'bg-primary/20 text-primary border-primary/50' 
                  : 'bg-bgSurface text-textSecondary border-borderDim hover:text-textPrimary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className='flex items-center gap-3'>
            <div className='relative w-full md:w-64'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted' />
              <input 
                type="text" 
                placeholder="Search name, email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='input-field pl-9 h-9 text-sm'
              />
            </div>
            <button onClick={exportCSV} className='p-2 bg-bgSurface border border-borderDim rounded-lg text-textSecondary hover:text-textPrimary hover:bg-bgCard transition-colors' title="Export CSV">
              <Download className='w-4 h-4' />
            </button>
            <button onClick={() => setIsDrawerOpen(true)} className='btn-primary h-9 flex items-center gap-1 text-sm'>
              <Plus className='w-4 h-4' /> New
            </button>
          </div>
        </div>

        <div className='glass-card p-4 min-h-[500px]'>
          {isLoading && leads.length === 0 ? (
            <div className='flex justify-center py-20 text-textMuted'>Loading leads...</div>
          ) : (
            <LeadTable leads={leads} onSort={handleSort} sortField={sortField} sortOrder={sortOrder} />
          )}
        </div>
      </div>

      <LeadDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Add New Lead">
        <form onSubmit={handleCreateSubmit} className='space-y-4'>
          <div>
            <label className='block text-xs font-medium text-textSecondary mb-1'>Name *</label>
            <input required type='text' className='input-field' value={newLeadData.name} onChange={e => setNewLeadData({...newLeadData, name: e.target.value})} />
          </div>
          <div>
            <label className='block text-xs font-medium text-textSecondary mb-1'>Email</label>
            <input type='email' className='input-field' value={newLeadData.email} onChange={e => setNewLeadData({...newLeadData, email: e.target.value})} />
          </div>
          <div>
            <label className='block text-xs font-medium text-textSecondary mb-1'>Company</label>
            <input type='text' className='input-field' value={newLeadData.company} onChange={e => setNewLeadData({...newLeadData, company: e.target.value})} />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-medium text-textSecondary mb-1'>Source</label>
              <select className='input-field appearance-none bg-[#13131F]' value={newLeadData.source} onChange={e => setNewLeadData({...newLeadData, source: e.target.value})}>
                {['Website', 'LinkedIn', 'Referral', 'Ads', 'Cold Call', 'Event', 'Partner'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className='block text-xs font-medium text-textSecondary mb-1'>Priority</label>
              <select className='input-field appearance-none bg-[#13131F]' value={newLeadData.priority} onChange={e => setNewLeadData({...newLeadData, priority: e.target.value})}>
                {['Cold', 'Warm', 'Hot'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button type='submit' className='w-full btn-primary h-11 mt-6'>Create Lead</button>
        </form>
      </LeadDrawer>
      
      {showToast && <Toast message="Lead created successfully!" onClose={() => setShowToast(false)} />}
    </>
  );
};

export default Leads;
