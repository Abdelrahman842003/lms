import React from 'react';
import { Play, RotateCcw, Download, Maximize, Minimize } from 'lucide-react';
import { SupportedLanguage } from '@/lib/code-execution';
import { Select } from '@/components/ui';

interface EditorHeaderProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  onRun: () => void;
  onReset: () => void;
  onDownload: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isExecuting: boolean;
}

const LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML/CSS' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' }
];

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  language,
  setLanguage,
  onRun,
  onReset,
  onDownload,
  isFullscreen,
  toggleFullscreen,
  isExecuting,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-surface-secondary dark:bg-gray-900 border-b border-border-theme-secondary dark:border-gray-800 rounded-t-xl gap-3">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <Select
          options={LANGUAGES}
          value={language}
          onChange={(val) => setLanguage(val as SupportedLanguage)}
          className="w-40 text-sm"
        />
      </div>


      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={onRun}
          disabled={isExecuting}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all ${
            isExecuting ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }`}
        >
          <Play size={16} className={isExecuting ? 'animate-pulse' : ''} />
          {isExecuting ? 'Running...' : 'Run Code'}
        </button>

        <button
          onClick={onReset}
          className="p-2 text-text-theme-secondary hover:text-text-theme-primary hover:bg-surface-hover dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg transition-all active:scale-95 tooltip-trigger"
          title="Reset to Starter Template"
        >
          <RotateCcw size={18} />
        </button>
        
        <button
          onClick={onDownload}
          className="p-2 text-text-theme-secondary hover:text-text-theme-primary hover:bg-surface-hover dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg transition-all active:scale-95 tooltip-trigger"
          title="Download Code"
        >
          <Download size={18} />
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="p-2 text-text-theme-secondary hover:text-text-theme-primary hover:bg-surface-hover dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg transition-all active:scale-95 hidden sm:block tooltip-trigger"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </div>
  );
};

