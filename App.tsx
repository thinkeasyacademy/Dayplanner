import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import { ViewType, Task, Project, TimelineItemType, Profile, AppLockSettings } from './types';
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import TimelineView from './components/Timeline/TimelineView';
import BoardView from './components/Board/BoardView';
import UnplannedView from './components/Unplanned/UnplannedView';
import WorkspaceView from './components/Workspace/WorkspaceView';
import FAB from './components/UI/FAB';
import TaskModal from './components/UI/TaskModal';
import ProjectModal from './components/UI/ProjectModal';
import ProfileModal from './components/UI/ProfileModal';
import SearchBar from './components/UI/SearchBar';
import AuthScreen from './components/Auth/AuthScreen';
import ConfirmModal from './components/UI/ConfirmModal';
import ReminderPopup from './components/UI/ReminderPopup';

const supabaseUrl = 'https://vvqkjwuzlygdzpvpgcos.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cWtqd3V6bHlnZHpwdnBnY29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTUzMDUsImV4cCI6MjA4NTM3MTMwNX0.NbQXsnja0Vg4EOLOtO8VdoRkbkffMfcZbzrccibAVnM';
export const supabase = createClient(supabaseUrl, supabaseKey);

const getLocalDateString = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [activeView, setActiveView] = useState<ViewType>(ViewType.TIMELINE);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile>({ name: 'Member', email: '', avatar: null });
  const [appLock, setAppLock] = useState<AppLockSettings>({ enabled: false, pin: null, timeoutMinutes: 1, lastUnlockedAt: null });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('taskito_dark') === 'true');
  const [reminderTone, setReminderTone] = useState(() => localStorage.getItem('taskito_tone') || 'louder');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newType, setNewType] = useState<TimelineItemType>('task');
  const [isBigNoteMode, setIsBigNoteMode] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'todo' | 'upcoming'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeReminder, setActiveReminder] = useState<Task | null>(null);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);

  const alarmAudio = useRef<HTMLAudioElement | null>(null);
  const successAudio = useRef<HTMLAudioElement | null>(null);
  const firedReminders = useRef<Set<string>>(new Set());

  // Back Button Logic
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isTaskModalOpen) setIsTaskModalOpen(false);
      else if (isProjectModalOpen) setIsProjectModalOpen(false);
      else if (isProfileModalOpen) setIsProfileModalOpen(false);
      else if (isSearchOpen) setIsSearchOpen(false);
      else if (confirmState?.isOpen) setConfirmState(null);
      else if (activeReminder) handleDismissReminder();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isTaskModalOpen, isProjectModalOpen, isProfileModalOpen, isSearchOpen, confirmState, activeReminder]);

  const openModalWithHistory = (setter: (val: boolean) => void) => {
    window.history.pushState({ modal: true }, '');
    setter(true);
  };

  // Auth Listener (Optimized - No Reload)
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setActiveView(ViewType.TIMELINE); // Redirect to Timeline on successful auth
      }
      setIsLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        setActiveView(ViewType.TIMELINE); // Ensure UI resets to Timeline when logging in
      } else {
        setTasks([]);
        setProjects([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Success Sound Preload
  useEffect(() => {
    successAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  }, []);

  // Reminder Checker
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      const now = new Date();
      const nowDate = getLocalDateString(now);
      const nowTotalMin = now.getHours() * 60 + now.getMinutes();

      tasks.forEach(task => {
        if (!task.date || task.completed || !task.time || task.reminderMinutes === undefined) return;
        
        const [h, m] = task.time.split(':').map(Number);
        const taskTotalMin = h * 60 + m;
        const triggerTimeMin = taskTotalMin - task.reminderMinutes;

        if (task.date === nowDate && nowTotalMin === triggerTimeMin) {
          const key = `${task.id}-${triggerTimeMin}`;
          if (!firedReminders.current.has(key)) {
            firedReminders.current.add(key);
            triggerReminder(task);
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 20000); 
    return () => clearInterval(interval);
  }, [tasks]);

  const triggerReminder = (task: Task) => {
    setActiveReminder(task);
    window.history.pushState({ modal: 'reminder' }, '');
    
    if (!alarmAudio.current) {
      alarmAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      alarmAudio.current.loop = true;
    }
    alarmAudio.current.play().catch(e => console.log("Audio play blocked", e));

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Think Easy Academy: ${task.title}`, {
        body: task.details || "Time for your task!",
        icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png'
      });
    }
  };

  const handleDismissReminder = () => {
    setActiveReminder(null);
    if (alarmAudio.current) {
      alarmAudio.current.pause();
      alarmAudio.current.currentTime = 0;
    }
  };

  const loadData = async () => {
    if (!user) return;
    try {
      const [{ data: tData }, { data: pData }, { data: profData }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      ]);
      setTasks(tData || []);
      setProjects(pData || []);
      if (profData) setProfile({ name: profData.name, email: profData.email, avatar: profData.avatar });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleToggleTask = async (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (t) {
      const newStatus = !t.completed;
      
      // Play sound if marking as complete
      if (newStatus && successAudio.current) {
        successAudio.current.currentTime = 0;
        successAudio.current.play().catch(() => {});
      }

      setTasks(prev => prev.map(task => task.id === id ? { ...task, completed: newStatus } : task));
      await supabase.from('tasks').update({ completed: newStatus }).eq('id', id);
      loadData();
    }
  };

  const handleSaveTask = async (data: Partial<Task>) => {
    if (!user) return;
    try {
      if (editingTask) {
        await supabase.from('tasks').update(data).eq('id', editingTask.id);
      } else {
        await supabase.from('tasks').insert([{
          ...data, id: crypto.randomUUID(), user_id: user.id, createdAt: Date.now(), completed: false
        }]);
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSignOut = async () => {
    setAuthMode('signin');
    await supabase.auth.signOut();
  };

  const handleDeleteAccount = async () => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Account?',
      message: 'This will permanently delete your account and all data. This cannot be undone.',
      onConfirm: async () => {
        if (!user) return;
        setIsLoading(true);
        const { error } = await supabase.rpc('delete_user', { user_id: user.id });
        if (!error) {
          setAuthMode('signup');
          await supabase.auth.signOut();
        } else {
          alert(error.message);
        }
        setIsLoading(false);
        setConfirmState(null);
      }
    });
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('taskito_dark', String(darkMode));
  }, [darkMode]);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] transition-colors"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <AuthScreen initialMode={authMode} onModeChange={setAuthMode} />;

  return (
    <div className="flex flex-col h-full w-full max-w-md bg-white dark:bg-[#121212] shadow-2xl relative overflow-hidden transition-colors duration-300 mx-auto">
      <Header activeView={activeView} darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} onSearchClick={() => openModalWithHistory(setIsSearchOpen)} />
      {isSearchOpen && <SearchBar value={searchQuery} onChange={setSearchQuery} onClose={() => {setSearchQuery(''); setIsSearchOpen(false);}} />}
      
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        {activeView === ViewType.TIMELINE && <TimelineView tasks={tasks} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onToggle={handleToggleTask} onDelete={async id => { await supabase.from('tasks').delete().eq('id', id); loadData(); }} onEdit={t => {setEditingTask(t); openModalWithHistory(setIsTaskModalOpen);}} upcomingCount={tasks.filter(t => t.date && t.date > getLocalDateString() && !t.completed).length} todoCount={tasks.filter(t => t.date === selectedDate && !t.completed).length} unplannedCount={tasks.filter(t => !t.date).length} profileName={profile.name} activeFilter={timelineFilter} onFilterChange={setTimelineFilter} onSwitchToUnplanned={() => setActiveView(ViewType.UNPLANNED)} />}
        {activeView === ViewType.BOARD && <BoardView tasks={tasks} projects={projects} onToggle={handleToggleTask} onEdit={t => {setEditingTask(t); openModalWithHistory(setIsTaskModalOpen);}} onEditProject={p => {setEditingProject(p); openModalWithHistory(setIsProjectModalOpen);}} onDeleteProject={async id => { if(confirm('Delete project?')) { await supabase.from('projects').delete().eq('id', id); await loadData(); } }} onAddProject={() => {setEditingProject(null); openModalWithHistory(setIsProjectModalOpen);}} />}
        {activeView === ViewType.UNPLANNED && <UnplannedView tasks={tasks} onToggle={handleToggleTask} onEdit={t => {setEditingTask(t); openModalWithHistory(setIsTaskModalOpen);}} onDelete={async id => { await supabase.from('tasks').delete().eq('id', id); loadData(); }} onAssignDate={async (id, d) => {await supabase.from('tasks').update({ date: d }).eq('id', id); loadData();}} onAddTask={() => {setNewType('task'); openModalWithHistory(setIsTaskModalOpen);}} onAddNote={() => {setNewType('note'); openModalWithHistory(setIsTaskModalOpen);}} />}
        {activeView === ViewType.WORKSPACE && <WorkspaceView projects={projects} setProjects={setProjects} notesCount={tasks.filter(t => t.type === 'note').length} reminderTone={reminderTone} setReminderTone={setReminderTone} profile={profile} onEditProfile={() => openModalWithHistory(setIsProfileModalOpen)} appLock={appLock} setAppLock={setAppLock} onSignOut={handleSignOut} onDeleteAccount={handleDeleteAccount} />}
      </main>

      <FAB onAddTask={() => {setNewType('task'); setEditingTask(null); openModalWithHistory(setIsTaskModalOpen);}} onAddNote={() => {setNewType('note'); setEditingTask(null); openModalWithHistory(setIsTaskModalOpen);}} onAddBigNote={() => {setNewType('note'); setIsBigNoteMode(true); setEditingTask(null); openModalWithHistory(setIsTaskModalOpen);}} />
      <BottomNav activeView={activeView} setActiveView={setActiveView} />
      
      {isTaskModalOpen && <TaskModal task={editingTask} projects={projects} onClose={() => {setIsTaskModalOpen(false); setEditingTask(null); setIsBigNoteMode(false);}} onSave={handleSaveTask} defaultDate={selectedDate} forceType={newType} isBigNoteInitial={isBigNoteMode} />}
      {isProjectModalOpen && <ProjectModal project={editingProject} onClose={() => setIsProjectModalOpen(false)} onSave={async p => { if(editingProject) await supabase.from('projects').update(p).eq('id', editingProject.id); else await supabase.from('projects').insert([{...p, id: crypto.randomUUID(), user_id: user.id}]); loadData(); setIsProjectModalOpen(false); }} />}
      {isProfileModalOpen && <ProfileModal profile={profile} onClose={() => setIsProfileModalOpen(false)} onSave={async p => { setProfile(p); await supabase.from('profiles').upsert([{...p, id: user.id}]); setIsProfileModalOpen(false); }} />}
      {confirmState?.isOpen && <ConfirmModal title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(null)} />}
      {activeReminder && <ReminderPopup task={activeReminder} onDismiss={handleDismissReminder} onView={() => { setEditingTask(activeReminder); openModalWithHistory(setIsTaskModalOpen); handleDismissReminder(); }} />}
    </div>
  );
};

export default App;