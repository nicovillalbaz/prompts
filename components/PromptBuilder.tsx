import React, { useState, useEffect, useRef } from 'react';
import { generateOptimizedPrompt } from '../services/geminiService';
import { ObjectiveType, DetailLevelType, PromptSections, SavedPrompt } from '../types';
import { SectionInput } from './SectionInput';

interface PromptBuilderProps {
  onSave: (promptData: Omit<SavedPrompt, 'id'>) => void;
  initialData?: SavedPrompt | null;
}

export const PromptBuilder: React.FC<PromptBuilderProps> = ({ onSave, initialData }) => {
  const [basePrompt, setBasePrompt] = useState("");
  const [objective, setObjective] = useState<ObjectiveType>(ObjectiveType.CREATE);
  const [detailLevel, setDetailLevel] = useState<DetailLevelType>(DetailLevelType.BRIEF);
  const [isLoading, setIsLoading] = useState(false);
  const [finalResult, setFinalResult] = useState("");
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // State for individual sections
  const [sections, setSections] = useState<PromptSections>({
    instruction: "",
    context: "",
    targetAudience: "",
    valueProposition: "",
    personality: "",
    detailLevel: "", 
    additionalData: "",
    outputFormat: ""
  });

  // Ref to scroll to results
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load initial data if provided (e.g. when loading from library)
// components/PromptBuilder.tsx

  useEffect(() => {
    if (initialData) {
      // ANTES DECÍA: setBasePrompt(initialData.basePrompt);
      // CÁMBIALO POR:
      setBasePrompt(initialData.basePrompt || ""); 
      
      setObjective(initialData.type);
      setDetailLevel(initialData.detailLevel || "General"); // También protege esto por si acaso
      setSections(initialData.sections);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [initialData]);

  const handleImprove = async () => {
    if (!basePrompt.trim()) return;

    setIsLoading(true);
    try {
      const optimized = await generateOptimizedPrompt({
        basePrompt,
        objective,
        detailLevel
      });
      setSections(optimized);
      setSaveStatus('idle'); // Reset save status on new generation
      // Scroll to results after short delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un error al generar el prompt. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reconstruct the final prompt whenever sections change
  useEffect(() => {
    if (!sections.instruction) {
      setFinalResult("");
      return;
    }

    const buildFinal = `
## INSTRUCCIÓN
${sections.instruction}

## CONTEXTO
${sections.context}

## PÚBLICO OBJETIVO
${sections.targetAudience}

## PROPUESTA ÚNICA DE VALOR
${sections.valueProposition}

## PERSONALIDAD DE MARCA
${sections.personality}

## NIVEL DE DETALLE
${sections.detailLevel}

## DATOS ADICIONALES
${sections.additionalData}

## FORMATO DE SALIDA
${sections.outputFormat}
    `.trim();

    setFinalResult(buildFinal);
  }, [sections]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalResult);
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
  };

  const handleSaveClick = () => {
    if (!finalResult) return;

    // Create a title from the instruction (first 60 chars)
    const title = sections.instruction 
        ? sections.instruction.slice(0, 60) + (sections.instruction.length > 60 ? '...' : '')
        : `Prompt ${objective}`;
    
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

    onSave({
        title,
        content: finalResult,
        date: formattedDate,
        type: objective,
        sections: sections,
        basePrompt: basePrompt,
        detailLevel: detailLevel
    });

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const objectives = Object.values(ObjectiveType);
  const detailLevels = Object.values(DetailLevelType);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-indigo-600 mb-2">Constructor</h1>
        <p className="text-gray-500">Transforma tu idea en un prompt profesional en segundos.</p>
      </div>

      {/* Step 1: Objective */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
            <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
            <h2 className="text-lg font-semibold text-gray-800">Objetivo Principal</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {objectives.map((obj) => (
            <button
              key={obj}
              onClick={() => setObjective(obj)}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                objective === obj
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-200 ring-2 ring-indigo-500 ring-offset-1'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {obj}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Base Prompt */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
        <div className="flex items-center gap-3 mb-4">
            <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
            <h2 className="text-lg font-semibold text-gray-800">Escribe tu idea o prompt base</h2>
        </div>
        <textarea
          value={basePrompt}
          onChange={(e) => setBasePrompt(e.target.value)}
          placeholder="Ej: Quiero crear un curso sobre marketing digital para principiantes..."
          className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-700 resize-y"
        />
        <div className="flex justify-between items-center mt-4">
            <div className="w-full max-w-xs">
               <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Nivel de Detalle</label>
                <div className="relative">
                    <select
                        value={detailLevel}
                        onChange={(e) => setDetailLevel(e.target.value as DetailLevelType)}
                        className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-50 border"
                    >
                        {detailLevels.map((level) => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button
            onClick={handleImprove}
            disabled={isLoading || !basePrompt?.trim()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium shadow-lg hover:shadow-indigo-200 transition-all transform active:scale-95 ${
                isLoading || !basePrompt?.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
            }`}
            >
            {isLoading ? (
                <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mejorando...
                </>
            ) : (
                <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5M16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
                </svg>
                Mejorar con IA
                </>
            )}
            </button>
        </div>
      </div>

      {sections.instruction && (
        <div ref={resultsRef} className="animate-fade-in-up space-y-8">
            
            <div className="flex items-center gap-3">
                <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="text-xl font-bold text-gray-800">Prompt Optimizado</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionInput
                    title="Instrucción / Tarea"
                    tooltip="¿Qué acción específica quieres que realice la IA? Sé claro y directo."
                    value={sections.instruction}
                    onChange={(v) => setSections({...sections, instruction: v})}
                    color="bg-gray-800"
                />
                <SectionInput
                    title="Contexto / Rol"
                    tooltip="Define el papel que debe adoptar la IA."
                    value={sections.context}
                    onChange={(v) => setSections({...sections, context: v})}
                    color="bg-gray-700"
                />
                <SectionInput
                    title="Público Objetivo"
                    tooltip="¿A quién va dirigido el resultado final?"
                    value={sections.targetAudience}
                    onChange={(v) => setSections({...sections, targetAudience: v})}
                    color="bg-gray-600"
                />
                 <SectionInput
                    title="Propuesta Única de Valor"
                    tooltip="¿Qué hace especial a tu producto o idea?"
                    value={sections.valueProposition}
                    onChange={(v) => setSections({...sections, valueProposition: v})}
                    color="bg-gray-600"
                />
                 <SectionInput
                    title="Personalidad de Marca"
                    tooltip="Define el tono y estilo de la comunicación."
                    value={sections.personality}
                    onChange={(v) => setSections({...sections, personality: v})}
                    color="bg-gray-800"
                />
                 <SectionInput
                    title="Nivel de Detalle"
                    tooltip="Define la profundidad y el estilo de la respuesta."
                    value={sections.detailLevel}
                    onChange={(v) => setSections({...sections, detailLevel: v})}
                    color="bg-gray-700"
                />
                 <div className="md:col-span-2">
                    <SectionInput
                        title="Datos Adicionales"
                        tooltip="Cualquier otra información o restricción."
                        value={sections.additionalData}
                        onChange={(v) => setSections({...sections, additionalData: v})}
                        color="bg-gray-700"
                    />
                 </div>
                 <div className="md:col-span-2">
                    <SectionInput
                        title="Formato de Salida"
                        tooltip="¿Cómo quieres que la IA te entregue la respuesta?"
                        value={sections.outputFormat}
                        onChange={(v) => setSections({...sections, outputFormat: v})}
                        color="bg-gray-600"
                    />
                 </div>
            </div>

            {/* Step 4: Final Result Preview */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                        <h2 className="text-lg font-bold text-indigo-900">Resultado Final</h2>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={copyToClipboard} className="text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                            </svg>
                            Copiar
                        </button>
                         <button 
                            onClick={handleSaveClick}
                            className={`${saveStatus === 'saved' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors`}
                         >
                            {saveStatus === 'saved' ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                    Guardado
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 3.42-.379l.158-.015H12c.99 0 1.98.098 2.963.293l.158.015c1.118.105 2.248.228 3.372.379Z" />
                                    </svg>
                                    Guardar
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-inner max-h-[500px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
                        {finalResult}
                    </pre>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Tus cambios arriba se reflejan aquí en tiempo real.</p>

                {showCopyNotification && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-2 px-4 rounded-full shadow-lg animate-bounce">
                        ¡Copiado al portapapeles!
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};