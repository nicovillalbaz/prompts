import React from 'react';

interface SectionInputProps {
  title: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  tooltip: string;
  color?: string;
}

export const SectionInput: React.FC<SectionInputProps> = ({ 
  title, 
  value, 
  onChange, 
  placeholder, 
  tooltip,
  color = "bg-gray-800"
}) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {title}
          </label>
          <div className="group relative flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
            <div className="absolute left-full top-0 ml-2 w-48 p-2 bg-gray-800 text-white text-xs rounded hidden group-hover:block z-50 shadow-lg">
              {tooltip}
            </div>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium text-white ${color}`}>
          {title.split(' ')[0]}
        </span>
      </div>
      <textarea
        className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y min-h-[100px] flex-grow"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};