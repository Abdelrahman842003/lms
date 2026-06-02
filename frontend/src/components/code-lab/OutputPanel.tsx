import React from 'react';
import { SupportedLanguage } from '@/lib/code-execution';
import { Terminal } from 'lucide-react';

interface OutputPanelProps {
  language: SupportedLanguage;
  output: string;
  error?: string;
  executionTime?: number;
  isExecuting: boolean;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ 
  language, 
  output, 
  error, 
  executionTime,
  isExecuting
}) => {
  if (language === 'html') {
    return (
      <div className="w-full h-full bg-white relative">
        {/* We use a sandbox iframe for security and proper rendering */}
        <iframe
          title="HTML Preview"
          srcDoc={output}
          className="w-full h-full border-none bg-white"
          sandbox="allow-scripts allow-same-origin"
        />
        {executionTime !== undefined && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm pointer-events-none">
            Live Preview
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-surface-secondary text-text-theme-primary dark:bg-[#0d1117] dark:text-gray-300 font-mono text-sm p-4 overflow-auto flex flex-col relative">
      <div className="flex items-center gap-2 text-text-theme-muted mb-3 select-none pb-2 border-b border-border-theme-secondary dark:border-gray-800">
        <Terminal size={16} />
        <span>Console Output</span>
        {executionTime !== undefined && !isExecuting && (
          <span className="ml-auto text-xs opacity-70">
            Executed in {executionTime}ms
          </span>
        )}
      </div>
      
      {isExecuting ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-50">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p>Executing...</p>
        </div>
      ) : (
        <div className="flex-1 whitespace-pre-wrap overflow-x-auto pb-8">
          {error ? (
            <div className="text-red-600 dark:text-red-400 font-bold mb-2">
              Error Execution Failed:
              <div className="font-normal mt-1 opacity-90">{error}</div>
            </div>
          ) : output ? (
            <div className="text-emerald-600 dark:text-green-300">
              {output}
            </div>
          ) : (
            <div className="text-text-theme-muted italic">No output.</div>
          )}
        </div>
      )}
    </div>
  );
};

