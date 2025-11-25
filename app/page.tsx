'use client'

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { PromptBuilder } from '@/components/PromptBuilder';
import { Library } from '@/components/Library'; 
import { savePrompt } from '@/app/actions/prompts';

export default function Home() {
  const [currentView, setCurrentView] = useState<string>('constructor');
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [initialFolderId, setInitialFolderId] = useState<string | null>(null);

  const handleNavigate = (view: string, params?: any) => {
      if (view === 'library') {
          setInitialFolderId(params?.folderId || null);
          
          if (params?.folderId === 'DEPARTMENT_ROOT') {
            setCurrentView('library-department');
          } else if (params?.folderId === 'ADMIN_ROOT') {
            setCurrentView('library-admin');
          } else {
            setCurrentView('library-personal');
          }
      } else {
          if (view === 'constructor') {
            setEditingPrompt(null);
          }
          setCurrentView(view);
      }
  };

  const handleSavePrompt = async (promptData: any) => {
    const result = await savePrompt(promptData);
    if (result.success) {
        alert("¡Guardado correctamente!");
    } else {
        alert("Error al guardar: " + result.error);
    }
  };

  const handleLoad = (prompt: any) => {
    setEditingPrompt({
        ...prompt,
        sections: prompt.sections || prompt.currentContent 
    });
    setCurrentView('constructor');
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />
      
      <main className="flex-1 ml-64 overflow-x-hidden">
        {currentView === 'constructor' ? (
            <PromptBuilder 
                onSave={handleSavePrompt} 
                initialData={editingPrompt}
            />
        ) : (
            <Library 
                key={initialFolderId || 'default'} 
                onLoad={handleLoad} 
                initialRootId={initialFolderId}
            />
        )}
      </main>
    </div>
  );
}