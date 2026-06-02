import React from 'react';
import Editor from '@monaco-editor/react';
import { SupportedLanguage } from '@/lib/code-execution';
import { useTheme } from '@/contexts/ThemeContext';

interface CodeEditorProps {
  language: SupportedLanguage;
  code: string;
  onChange: (value: string | undefined) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ language, code, onChange }) => {
  const { theme } = useTheme();
  const [editorTheme, setEditorTheme] = React.useState<'vs-dark' | 'light'>('vs-dark');

  // Map our language names to Monaco's expected language names
  const monacoLanguage = React.useMemo(() => {
    switch (language) {
      case 'html': return 'html';
      case 'javascript': return 'javascript';
      case 'python': return 'python';
      case 'sql': return 'sql';
      default: return 'javascript';
    }
  }, [language]);

  // Handle dynamic theme changing by observing document element changes or the context theme
  React.useEffect(() => {
    const root = window.document.documentElement;
    const updateTheme = () => {
      const isDark = root.classList.contains('dark') || root.getAttribute('data-theme') === 'dark';
      setEditorTheme(isDark ? 'vs-dark' : 'vs');
    };

    updateTheme();

    // Use MutationObserver to catch theme changes instantly
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    return () => observer.disconnect();
  }, [theme]);

  return (
    <div className="w-full h-full relative group text-left" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .code-lab-container textarea,
        .code-lab-container textarea:focus,
        .code-lab-container textarea.inputarea,
        .code-lab-container textarea.inputarea:focus,
        .monaco-editor textarea,
        .monaco-editor textarea:focus,
        .monaco-editor textarea.inputarea,
        .monaco-editor textarea.inputarea:focus,
        .monaco-editor input,
        .monaco-editor input:focus,
        .code-lab-container input,
        .code-lab-container input:focus {
          background: transparent !important;
          background-color: transparent !important;
          color: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          opacity: 0 !important;
          resize: none !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: 0 !important;
          position: absolute !important;
          overflow: hidden !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          pointer-events: none !important;
        }
      `}} />
      <Editor
        height="100%"
        language={monacoLanguage}
        value={code}
        theme={editorTheme}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Roboto Mono', monospace",
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          formatOnPaste: true,
          padding: { top: 16, bottom: 16 },
          lineNumbersMinChars: 3,
          automaticLayout: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full w-full bg-white dark:bg-[#1e1e1e] text-gray-500 dark:text-gray-400">
            <div className="animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <span className="ml-2">Loading Editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
};



