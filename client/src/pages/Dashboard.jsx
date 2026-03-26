import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getLeads, getFollowups } from '../store/leadsSlice';
import KpiCard from '../components/KpiCard';
import LeadTable from '../components/LeadTable';
import FollowUpCard from '../components/FollowUpCard';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { leads, followups, isLoading } = useSelector((state) => state.leads);
  
  const [filterStr, setFilterStr] = useState('');

  useEffect(() => {
    dispatch(getLeads(filterStr));
    dispatch(getFollowups('week'));
  }, [dispatch, filterStr]);

  // Derive metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const contactedLeads = leads.filter(l => l.status === 'Contacted' || l.status === 'Negotiating').length;
  const convertedLeads = leads.filter(l => l.status === 'Converted').length;

  // Simple source distribution for right rail
  const sourceRaw = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {});
  const sourceStats = Object.keys(sourceRaw).map(key => ({
    name: key, 
    value: sourceRaw[key],
    percent: totalLeads > 0 ? (sourceRaw[key] / totalLeads) * 100 : 0
  })).sort((a,b) => b.value - a.value).slice(0, 4);

  return (
    <div className='space-y-6'>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
      >
         <motion.div variants={itemVariants} onClick={() => setFilterStr('')} className="cursor-pointer">
           <KpiCard label="Total Leads" value={totalLeads} colorClass="bg-primary" />
         </motion.div>
         <motion.div variants={itemVariants} onClick={() => setFilterStr('status=New')} className="cursor-pointer">
           <KpiCard label="New Deals" value={newLeads} colorClass="bg-secondary" />
         </motion.div>
         <motion.div variants={itemVariants} onClick={() => setFilterStr('status=Contacted')} className="cursor-pointer">
           <KpiCard label="In Discussion" value={contactedLeads} colorClass="bg-warning" />
         </motion.div>
         <motion.div variants={itemVariants} onClick={() => setFilterStr('status=Converted')} className="cursor-pointer">
           <KpiCard label="Converted" value={convertedLeads} colorClass="bg-success" />
         </motion.div>
      </motion.div>
      
      <div className='flex flex-col lg:flex-row gap-6 items-start'>
        <div className='flex-1 w-full glass-card p-5'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-medium text-textPrimary tracking-wide'>Recent Activity</h3>
            {filterStr !== '' && (
              <button onClick={() => setFilterStr('')} className='text-xs text-primary hover:underline'>
                Clear Filters
              </button>
            )}
          </div>
          {isLoading ? (
            <div className='animate-pulse space-y-4'>
              {[...Array(5)].map((_, i) => <div key={i} className='h-12 bg-bgSurface rounded-lg'></div>)}
            </div>
          ) : (
            <LeadTable leads={leads.slice(0, 8)} /> 
          )}
        </div>
        
        {/* Right Rail */}
        <div className='w-full lg:w-72 space-y-6 shrink-0'>
          <div className='glass-card p-5'>
            <h3 className='text-sm uppercase tracking-wider text-textSecondary font-medium mb-4'>Top Sources</h3>
            <div className='space-y-4'>
              {sourceStats.map(stat => (
                <div key={stat.name} className='space-y-1.5'>
                  <div className='flex justify-between text-xs text-textPrimary'>
                    <span>{stat.name}</span>
                    <span className='text-textMuted'>{stat.value}</span>
                  </div>
                  <div className='w-full h-1.5 bg-bgSurface rounded-full overflow-hidden'>
                    <div className='h-full bg-primary rounded-full' style={{ width: `${stat.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className='glass-card p-5'>
            <h3 className='text-sm uppercase tracking-wider text-textSecondary font-medium mb-4'>Upcoming Follow-ups</h3>
            <div className='space-y-3'>
              {followups.slice(0, 3).map(f => (
                <FollowUpCard key={f._id} note={f} onClick={() => navigate(`/leads/${f.leadId._id}`)} />
              ))}
              {followups.length === 0 && <span className='text-xs text-textMuted'>No follow-ups soon.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
