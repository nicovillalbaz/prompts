import React, { useEffect, useState } from 'react';
import { getFolderContent, createSubFolder } from '@/app/actions/browser';
import { deletePrompt } from '@/app/actions/getPrompts';

interface FileSystemItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  meta?: any;
}

interface LibraryProps {
  onLoad: (prompt: any) => void;
  initialRootId?: string | null;
}

export const Library: React.FC<LibraryProps> = ({ onLoad, initialRootId }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialRootId || null);
  const [folderName, setFolderName] = useState("Inicio");
  const [parentId, setParentId] = useState<string | null>(null);
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [realCurrentIdRef, setRealCurrentIdRef] = useState("");

  useEffect(() => { loadContentWithIdFix() }, [currentFolderId]);

  const loadContentWithIdFix = async () => {
      setIsLoading(true);
      const result = await getFolderContent(currentFolderId || undefined);
      
      if (result.success && result.data) {
          setRealCurrentIdRef(result.data.currentFolder.id);
          setFolderName(result.data.currentFolder.name);
          setParentId(result.data.currentFolder.parentId);
          
          const folders = result.data.subFolders.map((f: any) => ({ id: f.id, name: f.name, type: 'folder' as const }));
          const files = result.data.files.map((p: any) => ({ id: p.id, name: p.title, type: 'file' as const, meta: p }));
          setItems([...folders, ...files]);
      } else {
          console.error(result.error);
      }
      setIsLoading(false);
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !realCurrentIdRef) return;
    
    setIsLoading(true);
    const res = await createSubFolder(realCurrentIdRef, newFolderName);
    
    if (res.success) {
        setNewFolderName("");
        setIsCreatingFolder(false);
        loadContentWithIdFix();
    } else {
        alert("Error al crear la carpeta");
        setIsLoading(false);
    }
  };

  const handleDeleteFile = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); 
      if(confirm("¿Borrar archivo?")) {
          await deletePrompt(id);
          loadContentWithIdFix();
      }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-lg font-medium text-gray-700">
            {parentId && (
                <button 
                    onClick={() => setCurrentFolderId(parentId)}
                    className="p-1 hover:bg-gray-100 rounded-full mr-2"
                    title="Atrás"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
            )}
            <span className="flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                {folderName}
            </span>
        </div>

        <button 
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva Carpeta
        </button>
      </div>

      {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="mb-6 flex gap-2 animate-fade-in-down">
              <input 
                autoFocus
                type="text" 
                placeholder="Nombre de la carpeta..."
                className="border border-indigo-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
              />
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Crear</button>
              <button type="button" onClick={() => setIsCreatingFolder(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Cancelar</button>
          </form>
      )}

      {isLoading ? (
          <div className="text-center py-20 text-gray-400">Cargando...</div>
      ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
             <p>Carpeta vacía</p>
          </div>
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => (
                  <div 
                    key={item.id}
                    onDoubleClick={() => {
                        if (item.type === 'folder') setCurrentFolderId(item.id);
                        else onLoad({
                            ...item.meta,
                            sections: item.meta.currentContent
                        });
                    }}
                    className={`
                        group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center h-40
                        ${item.type === 'folder' 
                            ? 'bg-amber-50 border-amber-100 hover:bg-amber-100 hover:border-amber-200 text-amber-900' 
                            : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md text-gray-700'
                        }
                    `}
                  >
                      {item.type === 'folder' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                      ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                      )}
                      
                      <span className="text-sm font-medium line-clamp-2 w-full break-words">
                          {item.name}
                      </span>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};