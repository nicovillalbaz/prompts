'use client'

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { PromptBuilder } from '@/components/PromptBuilder';
import { Library } from '@/components/Library'; 
import { UsersManager } from '@/components/UsersManager'; // <--- IMPORTANTE: Importamos el componente
import { savePrompt } from '@/app/actions/prompts';
import { TrashCan } from '@/components/TrashCan';
import { AuditLogViewer } from '@/components/AuditLogViewer';

export default function Home() {
  // Estados de navegación y contenido
  const [currentView, setCurrentView] = useState<string>('constructor');
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [initialFolderId, setInitialFolderId] = useState<string | null>(null);

  // Función para manejar la navegación desde el Sidebar
  const handleNavigate = (view: string, params?: any) => {
      if (view === 'library') {
          // Si nos pasan un folderId específico (ej: PERSONAL_ROOT, DEPARTMENT_ROOT), lo seteamos
          setInitialFolderId(params?.folderId || null);
          
          // Nota: Ya no necesitamos lógica compleja aquí para los botones del sidebar
          // porque el componente Library se encarga de cargar lo que le diga el ID.
          setCurrentView('library'); 
      } else {
          // Si vamos al constructor, limpiamos la edición para empezar de cero
          if (view === 'constructor') {
            setEditingPrompt(null);
          }
          setCurrentView(view); // Esto manejará 'users' también
      }
  };

  // Función para guardar el prompt (llamada desde PromptBuilder)
  const handleSavePrompt = async (promptData: any) => {
    const result = await savePrompt(promptData);
    
    if (result.success) {
        // Usamos un modal o un toast en lugar de alert
        alert("¡Guardado correctamente!"); 
        // Opcional: Si quieres que tras guardar te lleve a la biblioteca:
        // handleNavigate('library', { folderId: promptData.targetFolderId || 'PERSONAL_ROOT' });
    } else {
        alert("Error al guardar: " + result.error);
    }
  };

  // Función para cargar un prompt desde la Biblioteca al Constructor
  const handleLoad = (prompt: any) => {
    setEditingPrompt({
        ...prompt,
        // Aseguramos compatibilidad de formatos por si acaso
        sections: prompt.sections || prompt.currentContent 
    });
    setCurrentView('constructor');
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Menú Lateral */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
      />
      
      {/* Área Principal */}
      <main className="flex-1 ml-64 overflow-x-hidden">
        
        {/* VISTA 1: CONSTRUCTOR */}
        {currentView === 'constructor' && (
            <PromptBuilder 
                onSave={handleSavePrompt} 
                initialData={editingPrompt}
            />
        )}
        
        {/* VISTA 2: BIBLIOTECA (Maneja Personal, Depto y Admin) */}
        {currentView === 'library' && (
            <Library 
                // Usamos 'key' para forzar que el componente se reinicie si cambiamos de carpeta raíz
                key={initialFolderId || 'default'} 
                onLoad={handleLoad} 
                initialRootId={initialFolderId}
                // 🚨 CORRECCIÓN: Pasar la prop requerida 'onNavigate'
                onNavigate={handleNavigate} 
            />
        )}

        {/* VISTA 3: GESTIÓN DE USUARIOS (¡AQUÍ ESTÁ LA MAGIA!) */}
        {currentView === 'users' && (
            <UsersManager />
        )}
        {currentView === 'trash' && (
            <TrashCan />
        )}
        {/* VISTA 5: AUDITORÍA */}
        {currentView === 'audit' && (
            <div className="p-10 text-center">
                <h1 className="text-2xl font-bold mb-4">Auditoría de Acciones</h1>
                <p className="text-gray-500">Aquí se registrarán todas las acciones (Crear/Borrar/Renombrar).</p>
                {<AuditLogViewer />}
            </div>
        )}
      </main>
    </div>
  );
}