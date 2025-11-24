'use client'

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { PromptBuilder } from '@/components/PromptBuilder';
import { Library } from '@/components/Library'; 
import { savePrompt } from '@/app/actions/prompts';
import { getPrompts, deletePrompt } from '@/app/actions/getPrompts';

// Definimos los tipos aquí para evitar errores de importación rápida
type View = 'constructor' | 'library';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('constructor');
  const [dbPrompts, setDbPrompts] = useState<any[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);

  // Cargar prompts cada vez que entramos a la vista 'library'
  useEffect(() => {
    if (currentView === 'library') {
        loadPrompts();
    }
  }, [currentView]);

  const loadPrompts = async () => {
    const result = await getPrompts();
    if (result.success) {
        setDbPrompts(result.prompts);
    }
  };

  const handleSavePrompt = async (promptData: any) => {
    const result = await savePrompt(promptData);
    if (result.success) {
        alert("¡Guardado correctamente!");
        // Opcional: ir a la biblioteca automáticamente
        // setCurrentView('library'); 
    } else {
        alert("Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm("¿Seguro que quieres borrar este prompt?")) {
        await deletePrompt(id);
        loadPrompts(); // Recargar la lista
    }
  };

  const handleLoad = (prompt: any) => {
    setEditingPrompt({
        ...prompt,
        sections: prompt.sections // Pasamos el JSON guardado
    });
    setCurrentView('constructor');
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        currentView={currentView} 
        onNavigate={(view: any) => {
            setCurrentView(view);
            if (view === 'constructor') setEditingPrompt(null); // Limpiar al ir a crear nuevo
        }} 
      />
      
      <main className="flex-1 ml-64 overflow-x-hidden">
        {currentView === 'constructor' ? (
            <PromptBuilder 
                onSave={handleSavePrompt} 
                initialData={editingPrompt}
            />
        ) : (
            <Library 
                onLoad={handleLoad}
            />
        )}
      </main>
    </div>
  );
}