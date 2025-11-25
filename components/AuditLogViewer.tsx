import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '@/app/actions/audit';

export const AuditLogViewer = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadLogs(); }, []);

    const loadLogs = async () => {
        setLoading(true);
        const res = await getAuditLogs();
        setLogs(res || []);
        setLoading(false);
    };

    const formatDetails = (details: any) => {
        if (!details) return '-';
        if (details.oldName) return `Renombrado: "${details.oldName}" -> "${details.newName}"`;
        if (details.destination) return `Movido a: ${details.destination}`;
        if (details.name) return `Item: ${details.name}`;
        return JSON.stringify(details);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Auditoría de Acciones</h1>
            
            {loading ? (
                <p className="text-center text-gray-500">Cargando logs...</p>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-1/12">Hora</th>
                                <th className="p-4 w-2/12">Usuario</th>
                                <th className="p-4 w-2/12">Acción</th>
                                <th className="p-4 w-5/12">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-xs font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                    <td className="p-4 font-medium text-gray-900">{log.user.fullName}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${log.action.includes('DELETE') ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs">{formatDetails(log.details)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && <div className="p-10 text-center text-gray-400">No hay registros de actividad.</div>}
                </div>
            )}
        </div>
    );
};