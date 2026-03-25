import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getLeadAuth, updateLead } from '../store/leadsSlice';
import axios from 'axios';
import StatusBadge from '../components/StatusBadge';
import PriorityDot from '../components/PriorityDot';
import NoteTimeline from '../components/NoteTimeline';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const getAuthHeaders = () => {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const LeadDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentLead, isLoading } = useSelector(state => state.leads);
  
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  useEffect(() => {
    dispatch(getLeadAuth(id));
    fetchNotes();
  }, [dispatch, id]);

  const fetchNotes = async () => {
    setNotesLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/leads/${id}/notes`, { headers: getAuthHeaders() });
      setNotes(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    
    try {
      await axios.post(`${BASE_URL}/api/leads/${id}/notes`, {
        noteText, followUpDate, followUpTime, isFollowUp
      }, { headers: getAuthHeaders() });
      setNoteText('');
      setFollowUpDate('');
      setFollowUpTime('');
      setIsFollowUp(false);
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const updateLeadStatus = async (newStatus) => {
    dispatch(updateLead({ id, data: { status: newStatus } }));
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(`${BASE_URL}/api/leads/${id}/notes/${noteId}`, { headers: getAuthHeaders() });
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !currentLead) {
    return <div className='p-6 text-textMuted'>Loading lead details...</div>;
  }

  return (
    <div className='flex flex-col lg:flex-row gap-6'>
      {/* Left Column: Lead Info */}
      <div className='w-full lg:w-1/3 space-y-6'>
        <div className='glass-card p-6 flex flex-col items-center text-center'>
          <div className='w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-3xl mb-4'>
            {currentLead.name.charAt(0)}
          </div>
          <h2 className='text-xl font-serif text-textPrimary mb-1'>{currentLead.name}</h2>
          <p className='text-sm text-textMuted mb-4'>{currentLead.company || 'No Company'}</p>
          
          <div className='flex gap-2 mb-6'>
            <StatusBadge status={currentLead.status} />
            <div className='px-2.5 py-1 rounded-full text-xs font-medium border border-borderDim bg-bgSurface flex items-center gap-1.5'>
              <PriorityDot priority={currentLead.priority} />
              {currentLead.priority}
            </div>
          </div>

          <div className='w-full text-left space-y-4 pt-4 border-t border-borderDim'>
            <div>
              <span className='block text-xs text-textMuted uppercase tracking-wider mb-1'>Email Address</span>
              <span className='text-sm text-textPrimary'>{currentLead.email || '--'}</span>
            </div>
            <div>
              <span className='block text-xs text-textMuted uppercase tracking-wider mb-1'>Phone Number</span>
              <span className='text-sm text-textPrimary'>{currentLead.phone || '--'}</span>
            </div>
            <div>
              <span className='block text-xs text-textMuted uppercase tracking-wider mb-1'>Source</span>
              <span className='text-sm text-textPrimary'>{currentLead.source}</span>
            </div>
          </div>
        </div>

        <div className='glass-card p-6'>
          <h3 className='text-sm font-medium text-textSecondary uppercase tracking-wider mb-4'>Update Status</h3>
          <div className='flex flex-wrap gap-2'>
            {['New', 'Contacted', 'Negotiating', 'Converted', 'Lost'].map(status => (
              <button 
                key={status} 
                onClick={() => updateLeadStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  currentLead.status === status 
                    ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(79,110,247,0.3)]' 
                    : 'bg-bgSurface border-borderDim text-textSecondary hover:text-textPrimary hover:bg-bgCard'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Timeline & Notes */}
      <div className='flex-1 w-full flex flex-col'>
        <div className='glass-card p-6 mb-6'>
          <h3 className='text-lg font-serif italic text-textPrimary tracking-wide mb-4'>Add Note</h3>
          <form onSubmit={handleAddNote} className='space-y-4'>
            <textarea 
              className='input-field min-h-[100px] resize-y'
              placeholder='Write a note about this lead...'
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              required
            ></textarea>
            
            <div className='flex items-center gap-2 mb-2'>
              <input 
                type="checkbox" 
                id="followup" 
                checked={isFollowUp} 
                onChange={e => setIsFollowUp(e.target.checked)} 
                className='rounded border-borderDim text-primary focus:ring-primary bg-bgSurface'
              />
              <label htmlFor="followup" className='text-sm text-textSecondary select-none cursor-pointer'>Make this a follow-up?</label>
            </div>

            {isFollowUp && (
              <div className='flex gap-4 p-4 border border-borderDim rounded-lg bg-bgSurface/50'>
                <div className='flex-1'>
                  <label className='block text-xs text-textMuted mb-1'>Date</label>
                  <input type='date' className='input-field h-9 text-sm' value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} required />
                </div>
                <div className='flex-1'>
                  <label className='block text-xs text-textMuted mb-1'>Time</label>
                  <input type='time' className='input-field h-9 text-sm' value={followUpTime} onChange={e => setFollowUpTime(e.target.value)} />
                </div>
              </div>
            )}

            <div className='flex justify-end'>
              <button type='submit' className='btn-primary text-sm'>Save Note</button>
            </div>
          </form>
        </div>

        <h3 className='text-lg font-serif italic text-textPrimary tracking-wide mb-6 px-2'>Activity Timeline</h3>
        {notesLoading
          ? <div className='text-center text-textMuted py-6'>Loading notes...</div>
          : <NoteTimeline notes={notes} onDelete={handleDeleteNote} />
        }
      </div>
    </div>
  );
};

export default LeadDetail;
