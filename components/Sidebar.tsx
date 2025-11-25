import React, { useEffect, useState } from 'react';
import { logout, getUserInfo } from '@/app/actions/auth';
import { getSidebarData, createNewDepartment } from '@/app/actions/sidebar';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  // Cargar datos al iniciar
  useEffect(() => {
    const init = async () => {
        const user = await getUserInfo();
        if (user) {
            setIsAdmin(user.role === 'SUPERADMIN');
        }

        const sidebarData = await getSidebarData();
        if (sidebarData.departments) {
            setDepartments(sidebarData.departments);
        }
    };
    init();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newDeptName.trim()) return;
      await createNewDepartment(newDeptName);
      setNewDeptName("");
      setIsCreating(false);
      window.location.reload(); // Recargar para ver cambios
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-10">
      {/* HEADER */}
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
         <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">CA</div>
         <div>
            <h1 className="font-bold text-gray-900 text-lg leading-none">Clic&App</h1>
            <h1 className="text-xs font-bold text-indigo-500 tracking-widest">PROMPTS</h1>
         </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* 1. CONSTRUCTOR */}
        <button
            onClick={() => onNavigate('constructor')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'constructor' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M2 12h20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
            Constructor
        </button>

        <div className="pt-6 pb-2"><p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Mis Espacios</p></div>

        {/* MI ESPACIO & MI DEPARTAMENTO */}
        <button
            onClick={() => onNavigate('library', { folderId: 'PERSONAL_ROOT' })}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'library-personal' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Mi Espacio
        </button>

        <div className="pt-6 pb-2 flex justify-between items-center pr-4">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Departamentos</p>
            {isAdmin && (
                <button onClick={() => setIsCreating(!isCreating)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded" title="Agregar Departamento">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            )}
        </div>

        {isCreating && (
            <form onSubmit={handleCreateDept} className="px-2 mb-2 animate-fade-in-down">
                <div className="flex gap-1">
                    <input autoFocus className="w-full px-2 py-1 text-xs border border-indigo-300 rounded focus:outline-none" placeholder="Nombre..." value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
                    <button type="submit" className="bg-indigo-600 text-white px-2 rounded text-xs">OK</button>
                </div>
            </form>
        )}

        {departments.map(dept => (
            <button
                key={dept.id}
                onClick={() => onNavigate('library', { folderId: dept.id, folderName: dept.name })}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                {dept.name}
            </button>
        ))}

        {departments.length === 0 && (
            <p className="px-4 text-xs text-gray-400 italic">No tienes departamentos asignados.</p>
        )}

        {/* --- SECCIÓN ADMINISTRACIÓN --- */}
        {isAdmin && (
            <>
                <div className="pt-6 pb-2"><p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Admin</p></div>
                
                {/* 1. Gestión Global (Todos los Dptos) */}
                <button
                    onClick={() => onNavigate('library', { folderId: 'ADMIN_ROOT' })}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'library-admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                    Gestión Global
                </button>

                {/* 2. Gestión de Usuarios */}
                <button
                    onClick={() => onNavigate('users')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'users' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Gestión de Usuarios
                </button>
                
                {/* 3. PAPELERA DE RECICLAJE (NUEVO) */}
                <button
                    onClick={() => onNavigate('trash')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'trash' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    Papelera de Reciclaje
                </button>
            </>
        )}

      </nav>

      <div className="p-4 border-t border-gray-100">
        <form action={logout}>
            <button type="submit" className="w-full flex items-center gap-2 px-2 text-gray-500 hover:text-red-600 text-xs font-medium">Cerrar Sesión</button>
        </form>
      </div>
    </div>
  );
};