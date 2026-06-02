"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { EditorHeader } from '@/components/code-lab/EditorHeader';
import { CodeEditor } from '@/components/code-lab/CodeEditor';
import { OutputPanel } from '@/components/code-lab/OutputPanel';
import { SupportedLanguage, executeCode, STARTER_TEMPLATES } from '@/lib/code-execution';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';

export default function CodeLabPage() {
  const { user } = useAuth();
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [codes, setCodes] = useState<Record<SupportedLanguage, string>>(STARTER_TEMPLATES);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [executionTime, setExecutionTime] = useState<number | undefined>();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'output'>('editor'); // For mobile

  // Load saved code from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('codeLab_savedCodes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCodes(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse saved codes", e);
      }
    }
  }, []);

  // Save to LocalStorage whenever codes change
  useEffect(() => {
    localStorage.setItem('codeLab_savedCodes', JSON.stringify(codes));
  }, [codes]);

  // Live preview for HTML/CSS
  useEffect(() => {
    if (language === 'html') {
      const timer = setTimeout(() => {
        setOutput(codes.html);
        setError(undefined);
      }, 500); // 500ms debounce
      return () => clearTimeout(timer);
    }
  }, [codes.html, language]);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setOutput('');
    setError(undefined);
    setExecutionTime(undefined);
  };

  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode !== undefined) {
      setCodes(prev => ({ ...prev, [language]: newCode }));
    }
  };

  const handleRun = useCallback(async () => {
    if (language === 'html') {
      setOutput(codes.html);
      toast.success("Live preview updated");
      if (window.innerWidth < 1024) setActiveTab('output');
      return;
    }

    setIsExecuting(true);
    setActiveTab('output'); // Switch to output tab on mobile
    
    try {
      const result = await executeCode(language, codes[language]);
      setOutput(result.output);
      setError(result.error);
      setExecutionTime(result.executionTime);
      
      if (result.error) {
        toast.error("Execution failed");
      } else {
        toast.success(`Executed successfully in ${result.executionTime}ms`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast.error("An unexpected error occurred");
    } finally {
      setIsExecuting(false);
    }
  }, [language, codes]);


  const handleReset = () => {
    if (confirm(`Are you sure you want to reset the ${language} code to the starter template? This will erase your current code.`)) {
      setCodes(prev => ({ ...prev, [language]: STARTER_TEMPLATES[language] }));
      setOutput('');
      setError(undefined);
      toast.success("Code reset to starter template");
    }
  };

  const handleDownload = () => {
    const extensions: Record<SupportedLanguage, string> = {
      javascript: 'js',
      html: 'html',
      python: 'py',
      sql: 'sql'
    };
    
    const element = document.createElement("a");
    const file = new Blob([codes[language]], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `my-code.${extensions[language]}`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
    toast.success("File downloaded!");
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcut for running code (Cmd/Ctrl + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [language, codes, handleRun]);


  return (
    <DashboardLayout role="student" user={user || undefined}>
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
        .code-lab-container input:focus,
        .code-lab-container .native-edit-context,
        .code-lab-container .native-edit-context:focus,
        .monaco-editor .native-edit-context,
        .monaco-editor .native-edit-context:focus {
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
      ` }} />
      <div className="code-lab-container flex flex-col h-[calc(100vh-14rem)] min-h-[550px] p-4 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        {/* Premium Header */}
        <div className="relative mb-6 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] premium-glass border border-border-theme-secondary overflow-hidden shadow-xl transition-all duration-300">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 blur-[100px] -z-10 animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 blur-[80px] -z-10"></div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light shrink-0 shadow-lg shadow-primary/5 transition-transform duration-300 hover:scale-105">
                <i className="fas fa-laptop-code text-xl sm:text-2xl animate-pulse-slow"></i>
              </div>
              <div className="min-w-0 space-y-1">
                <h1 className="text-xl sm:text-3xl font-black text-text-theme-primary tracking-tight">
                  Code Lab | مختبر البرمجة 💻
                </h1>
                <p className="text-text-theme-secondary font-medium text-xs sm:text-sm opacity-90 leading-relaxed">
                  اكتب وجرب الكود مباشرة في متصفحك وسنقوم بتشغيله لك فوراً
                </p>
              </div>
            </div>
            
            {/* Keyboard Shortcut Badge */}
            <div className="flex items-center gap-3 bg-surface-secondary/60 border border-border-theme-secondary/80 px-4 py-2.5 rounded-2xl text-xs font-bold text-text-theme-secondary shrink-0 shadow-sm self-stretch md:self-auto justify-between sm:justify-start">
              <span className="flex items-center gap-2">
                <i className="fas fa-keyboard text-primary-light text-sm"></i>
                <span className="opacity-80">اختصار التشغيل:</span>
              </span>
              <div className="flex items-center gap-1 font-mono text-[11px]" dir="ltr">
                <kbd className="px-2 py-1 rounded bg-surface-tertiary border border-border-theme-primary shadow-[0_1.5px_0_1px_rgba(0,0,0,0.1)] text-text-theme-primary font-bold">Ctrl</kbd>
                <span className="text-text-theme-muted font-normal">+</span>
                <kbd className="px-2 py-1 rounded bg-surface-tertiary border border-border-theme-primary shadow-[0_1.5px_0_1px_rgba(0,0,0,0.1)] text-text-theme-primary font-bold">Enter</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className={`flex flex-col lg:flex-row flex-1 bg-surface-primary dark:bg-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden border border-border-theme-secondary dark:border-gray-700/50 ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none w-screen h-screen' : ''}`} dir="ltr">
          
          {/* Mobile Tabs */}
          <div className="lg:hidden flex border-b border-border-theme-secondary dark:border-border-theme-secondary bg-surface-secondary dark:bg-gray-900">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'editor' ? 'text-primary border-b-2 border-primary' : 'text-text-theme-secondary'}`}
            >
              Code Editor
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'output' ? 'text-primary border-b-2 border-primary' : 'text-text-theme-secondary'}`}
            >
              Output
            </button>
          </div>

          {/* Left Side: Editor */}
          <div className={`flex-col flex-1 border-r border-border-theme-secondary dark:border-gray-800 h-full ${activeTab === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
            <EditorHeader
              language={language}
              setLanguage={handleLanguageChange}
              onRun={handleRun}
              onReset={handleReset}
              onDownload={handleDownload}
              isFullscreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
              isExecuting={isExecuting}
            />
            <div className="flex-1 relative">
              <CodeEditor
                language={language}
                code={codes[language]}
                onChange={handleCodeChange}
              />
            </div>
          </div>

          {/* Right Side: Output */}
          <div className={`flex-col flex-1 h-full bg-surface-secondary dark:bg-[#0d1117] ${activeTab === 'output' ? 'flex' : 'hidden lg:flex'}`}>
            <OutputPanel
              language={language}
              output={output}
              error={error}
              executionTime={executionTime}
              isExecuting={isExecuting}
            />
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}


