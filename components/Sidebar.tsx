import React from 'react';
import { logout } from '@/app/actions/auth';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-10">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
         <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-lg">
            PA
         </div>
         <div className="leading-tight">
            <h1 className="font-bold text-gray-900 text-lg">Prompt</h1>
            <h1 className="text-xs font-semibold text-indigo-500 tracking-wider">ARCHITECT</h1>
         </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        
        <button
            onClick={() => onNavigate('constructor')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'constructor'
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
            Constructor
        </button>

        <div className="pt-4 pb-2 mt-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Espacios</p>
        </div>

        <button
            onClick={() => onNavigate('library', { folderId: 'PERSONAL_ROOT' })}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'library-personal'
                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Mi Espacio
        </button>

        <button
            onClick={() => onNavigate('library', { folderId: 'DEPARTMENT_ROOT' })}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'library-department'
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Mi Departamento
        </button>

      </nav>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <form action={logout}>
            <button type="submit" className="w-full flex items-center gap-2 px-2 text-gray-500 hover:text-red-600 text-xs font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Cerrar Sesión
            </button>
        </form>
      </div>
    </div>
  );
};