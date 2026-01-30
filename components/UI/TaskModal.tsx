import React, { useState, useEffect } from 'react';
import { Task, Project, TimelineItemType } from '../../types';
import TimePicker from './TimePicker';
import DatePicker from './DatePicker';

interface TaskModalProps {
  task: Task | null;
  projects: Project[];
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  onDelete?: () => void;
  defaultDate: string;
  forceType?: TimelineItemType;
  isBigNoteInitial?: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, projects, onClose, onSave, onDelete, defaultDate, forceType, isBigNoteInitial }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [time, setTime] = useState(task?.time || '10:00');
  const [date, setDate] = useState<string | null>(task ? task.date : defaultDate);
  const [projectId, setProjectId] = useState(task?.projectId || '');
  const [type, setType] = useState<TimelineItemType>(task?.type || forceType || 'task');
  const [isBigNote, setIsBigNote] = useState(task?.isBigNote || isBigNoteInitial || false);
  const [description, setDescription] = useState(task?.description || '');
  const [details, setDetails] = useState(task?.details || '');
  const [reminderMinutes, setReminderMinutes] = useState<number | undefined>(task?.reminderMinutes);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!task) {
      setType(forceType || 'task');
      setIsBigNote(isBigNoteInitial || false);
    }
  }, [forceType, isBigNoteInitial, task]);

  const handleSave = () => {
    if (!title.trim()) return alert("Please enter a title");
    
    const taskData: Partial<Task> = {
      title,
      time: date ? time : '10:00',
      date,
      projectId: projectId || null,
      type,
      isBigNote,
      description,
      details,
      reminderMinutes: reminderMinutes === -1 ? undefined : reminderMinutes
    };

    onSave(taskData);
  };

  const format12h = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  const formatDateLong = (dStr: string) => {
    return new Date(dStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const reminderOptions = [
    { label: 'No Reminder', value: -1 },
    { label: 'At time of event', value: 0 },
    { label: '5 minutes before', value: 5 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '2 hours before', value: 120 },
    { label: '4 hours before', value: 240 },
    { label: '12 hours before', value: 720 },
    { label: '1 day before', value: 1440 },
    { label: '2 days before', value: 2880 },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fadeIn">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] overflow-y-auto max-h-[90vh] shadow-2xl relative animate-slideIn transition-colors scrollbar-hide">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {task ? 'Edit Item' : 'New Item'}
            </h3>
            {onDelete && (
              <button onClick={() => { if(confirm('Delete?')) { onDelete(); onClose(); } }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            )}
          </div>

          <div className="flex mb-8 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[1.5rem]">
            <button onClick={() => { setType('task'); setIsBigNote(false); }} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-2xl ${type === 'task' && !isBigNote ? 'bg-white dark:bg-slate-700 text-blue-600' : 'text-slate-500'}`}>Task</button>
            <button onClick={() => { setType('note'); setIsBigNote(false); }} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-2xl ${type === 'note' && !isBigNote ? 'bg-white dark:bg-slate-700 text-blue-600' : 'text-slate-500'}`}>Note</button>
            <button onClick={() => { setType('note'); setIsBigNote(true); }} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-2xl ${isBigNote ? 'bg-white dark:bg-slate-700 text-blue-600' : 'text-slate-500'}`}>Big Note</button>
          </div>

          <div className="space-y-5">
            <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold dark:text-white" />
            
            <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Subtitle / Context" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-medium text-sm dark:text-white" />

            {isBigNote && (
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl min-h-[100px] text-sm dark:text-white resize-none" />
            )}

            <div className="flex gap-2">
              <button onClick={() => { setDate(date || defaultDate); setShowDatePicker(true); }} className={`flex-1 py-3 rounded-xl border-2 ${date ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-transparent bg-slate-50 text-slate-400'}`}>
                <span className="text-[10px] font-black uppercase">Schedule</span>
              </button>
              <button onClick={() => { setDate(null); setShowDatePicker(false); setShowTimePicker(false); }} className={`flex-1 py-3 rounded-xl border-2 ${!date ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-transparent bg-slate-50 text-slate-400'}`}>
                <span className="text-[10px] font-black uppercase">Unplanned</span>
              </button>
            </div>

            {date && (
              <div className="space-y-4 pt-2">
                <button onClick={() => setShowDatePicker(!showDatePicker)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-left text-xs font-bold dark:text-white flex justify-between">
                  {formatDateLong(date)}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </button>
                {showDatePicker && <DatePicker selectedDate={date} onSelect={(d) => { setDate(d); setShowDatePicker(false); }} />}
                
                <button onClick={() => setShowTimePicker(!showTimePicker)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-left text-xs font-bold dark:text-white flex justify-between">
                  {format12h(time)}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </button>
                {showTimePicker && <TimePicker initialTime={time} onSelect={setTime} />}

                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Reminder Alert</label>
                   <select value={reminderMinutes === undefined ? -1 : reminderMinutes} onChange={(e) => setReminderMinutes(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none">
                     {reminderOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                   </select>
                </div>
              </div>
            )}

            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-bold dark:text-white outline-none">
              <option value="">No Project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex gap-4 mt-8">
            <button onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-[10px] rounded-2xl">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-lg">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
