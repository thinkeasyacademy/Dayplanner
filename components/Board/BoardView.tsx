
import React, { useState } from 'react';
import { Task, Project } from '../../types';

interface BoardViewProps {
  tasks: Task[];
  projects: Project[];
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onAddProject: () => void;
}

const BoardView: React.FC<BoardViewProps> = ({ tasks, projects, onToggle, onEdit, onEditProject, onDeleteProject, onAddProject }) => {
  const [activeTab, setActiveTab] = useState<'All' | string>('All');

  return (
    <div className="px-6 py-4 dark:bg-slate-900 transition-colors">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        </div>
        <h2 className="text-xl font-bold flex-1 truncate dark:text-white">Project Board</h2>
        <div className="flex space-x-2">
           <button 
            onClick={onAddProject}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>

      <div className="flex space-x-3 overflow-x-auto scrollbar-hide mb-8 pb-1">
        <button 
          onClick={() => setActiveTab('All')}
          className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap border-2 transition-all ${
            activeTab === 'All' 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'
          }`}
        >
          All
        </button>
        {projects.map(p => (
          <button 
            key={p.id}
            onClick={() => setActiveTab(p.id)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap border-2 transition-all ${
              activeTab === p.id 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {projects.map(p => {
        if (activeTab !== 'All' && activeTab !== p.id) return null;
        
        const projectTasks = tasks.filter(t => t.projectId === p.id);
        const completed = projectTasks.filter(t => t.completed).length;
        const total = projectTasks.length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        return (
          <div key={p.id} className="mb-10 bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm animate-fadeIn">
            <div className="flex justify-between items-center mb-3">
               <h4 className="text-lg font-bold text-slate-800 dark:text-white">{p.name}</h4>
               <div className="flex space-x-1">
                 <button 
                   onClick={() => onEditProject(p)}
                   className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                 </button>
                 <button 
                   onClick={() => onDeleteProject(p.id)}
                   className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                 </button>
               </div>
            </div>
            
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                style={{ width: `${percent}%` }}
              ></div>
            </div>

            <div className="flex space-x-4 mb-4 text-xs font-bold text-slate-400">
               <span className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="20 6 9 17 4 12"/></svg> {completed}/{total} tasks</span>
            </div>

            <div className="space-y-3">
              {projectTasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No tasks in this project yet.</p>
              ) : (
                projectTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="flex items-center space-x-3 py-2 border-t border-slate-50 dark:border-slate-700/50 cursor-pointer"
                    onClick={() => onEdit(task)}
                  >
                    <div 
                      onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                        task.completed ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-slate-900 border-blue-400'
                      }`}
                    >
                      {task.completed && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{task.title}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BoardView;
