import React, { useState, useEffect } from 'react';
import { renameItem, moveItem } from '@/app/actions/browser';
import { getAvailableFolders } from '@/app/actions/prompts';

interface EditModalProps {
    item: any;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditItemModal: React.FC<EditModalProps> = ({ item, onClose, onSuccess }) => {
    const [newName, setNewName] = useState(item.name || item.title);
    const [newFolderId, setNewFolderId] = useState(item.folderId || item.parentId || '');
    const [availableFolders, setAvailableFolders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAvailableFolders().then(folders => {
            setAvailableFolders(folders || []);
            setLoading(false);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const itemType = item.type || (item.kind === 'folder' ? 'folder' : 'file');

        // 1. Renombrar si ha cambiado
        if (newName !== (item.name || item.title)) {
            const res = await renameItem(item.id, newName, itemType, item.name || item.title);
            if (!res.success) {
                alert("Error al renombrar: " + res.error);
                setLoading(false);
                return;
            }
        }

        // 2. Mover si ha cambiado la ubicación
        const currentParentId = item.folderId || item.parentId || '';
        if (newFolderId !== currentParentId) {
            const destinationFolder = availableFolders.find(f => f.id === newFolderId);
            const destinationName = destinationFolder ? destinationFolder.name : 'Raíz Personal';

            const res = await moveItem(item.id, newFolderId, itemType, destinationName);
            if (!res.success) {
                alert("Error al mover: No tienes permiso o destino inválido.");
                setLoading(false);
                return;
            }
        }

        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up space-y-4">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Editar {item.name || item.title}</h2>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nuevo Nombre</label>
                    <input 
                        required
                        type="text" 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Mover a Carpeta</label>
                    <select 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        value={newFolderId}
                        onChange={e => setNewFolderId(e.target.value)}
                        disabled={loading}
                    >
                        <option value={''}>Raíz Personal (Default)</option>
                        {availableFolders.map(f => (
                            <option key={f.id} value={f.id} disabled={f.id === item.id}>
                                {f.type === 'DEPARTMENT' ? `🏢 ${f.name}` : `📁 ${f.name}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
};