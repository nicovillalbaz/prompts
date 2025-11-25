import React, { useEffect, useState } from 'react';
import { getTrashItems, restoreItem, purgeItem } from '@/app/actions/trash';

export const TrashCan = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const res = await getTrashItems();
        setItems(res.items);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleRestore = async (id: string, type: 'folder'|'file') => {
        await restoreItem(id, type);
        load();
    };

    const handlePurge = async (id: string, type: 'folder'|'file') => {
        if(confirm("¿Eliminar para siempre? No se puede deshacer.")) {
            await purgeItem(id, type);
            load();
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-3xl">🗑️</span> Papelera de Reciclaje
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {items.length === 0 && !loading && (
                    <div className="p-12 text-center text-gray-400">La papelera está vacía.</div>
                )}
                
                <div className="divide-y divide-gray-100">
                    {items.map(item => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${item.kind === 'folder' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {item.kind === 'folder' 
                                        ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.765 8.5h-2.254c-.87 0-1.58-.238-2.111-.706-.53-.469-.786-1.16-.786-2.034V3.525c0-.745-.58-1.335-1.301-1.335H4.798c-.72 0-1.301.59-1.301 1.335v17.384c0 .745.58 1.335 1.3 1.335h14.43c.72 0 1.301-.59 1.301-1.335V9.835c0-.745-.58-1.335-1.301-1.335z"/></svg>
                                        : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
                                    }
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{item.name}</p>
                                    <p className="text-xs text-gray-500">Eliminado: {new Date(item.deletedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button onClick={() => handleRestore(item.id, item.kind)} className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors">
                                    Restaurar
                                </button>
                                <button onClick={() => handlePurge(item.id, item.kind)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors">
                                    Eliminar Definitivo
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};