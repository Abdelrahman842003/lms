/* eslint-disable @typescript-eslint/no-explicit-any */
export type SupportedLanguage = 'javascript' | 'html' | 'python' | 'sql';

export interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
}

// Store instances globally so we don't reload them every time
let pyodideInstance: any = null;
let sqlJsInstance: any = null;

// Helper to capture console logs
const captureLogs = async (callback: () => any): Promise<{ logs: string[], result: any }> => {
  const logs: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  const pushLog = (...args: any[]) => {
    logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
  };

  console.log = (...args) => { pushLog(...args); originalLog.apply(console, args); };
  console.error = (...args) => { pushLog('ERROR: ' + args.join(' ')); originalError.apply(console, args); };
  console.warn = (...args) => { pushLog('WARN: ' + args.join(' ')); originalWarn.apply(console, args); };
  console.info = (...args) => { pushLog('INFO: ' + args.join(' ')); originalInfo.apply(console, args); };

  let result;
  try {
    result = await callback();
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    console.info = originalInfo;
  }
  return { logs, result };
};

export const executeCode = async (language: SupportedLanguage, code: string): Promise<ExecutionResult> => {
  const startTime = performance.now();
  let output = '';
  let errorStr: string | undefined;

  try {
    if (language === 'javascript') {
      const { logs, result } = await captureLogs(async () => {
        // Safe evaluation
        const fn = new Function(code);
        return fn();
      });
      output = logs.join('\n');
      if (result !== undefined && typeof result !== 'function') {
        if (output) output += '\n';
        output += `<- ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`;
      }
    } 
    else if (language === 'html') {
      // HTML output is handled by iframe, we just return the code as output
      output = code;
    }
    else if (language === 'python') {
      if (!pyodideInstance) {
        output += 'Loading Python environment...\n';
        // Dynamically load pyodide
        await new Promise<void>((resolve, reject) => {
          if ((window as any).loadPyodide) return resolve();
          
          // Temporarily remove window.define to prevent RequireJS/Monaco Editor AMD loader from breaking Pyodide loading
          let originalDefine: any = undefined;
          let hasDefine = false;
          if (typeof window !== 'undefined' && (window as any).define) {
            originalDefine = (window as any).define;
            hasDefine = true;
            try {
              (window as any).define = undefined;
            } catch (e) {
              console.warn("Pyodide Loader: Could not disable window.define", e);
            }
          }

          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.onload = () => {
            if (hasDefine) {
              try {
                (window as any).define = originalDefine;
              } catch (e) {
                console.warn("Pyodide Loader: Could not restore window.define", e);
              }
            }
            resolve();
          };
          script.onerror = () => {
            if (hasDefine) {
              try {
                (window as any).define = originalDefine;
              } catch (e) {
                console.warn("Pyodide Loader: Could not restore window.define", e);
              }
            }
            reject(new Error('Failed to load Pyodide'));
          };
          document.head.appendChild(script);
        });

        // Hiding window.define also during loadPyodide initialization
        let originalDefine: any = undefined;
        let hasDefine = false;
        if (typeof window !== 'undefined' && (window as any).define) {
          originalDefine = (window as any).define;
          hasDefine = true;
          try {
            (window as any).define = undefined;
          } catch (e) {
            console.warn("Pyodide Init: Could not disable window.define", e);
          }
        }

        try {
          pyodideInstance = await (window as any).loadPyodide();
        } finally {
          if (hasDefine) {
            try {
              (window as any).define = originalDefine;
            } catch (e) {
              console.warn("Pyodide Init: Could not restore window.define", e);
            }
          }
        }
        output = ''; // clear loading message
      }
      
      const { logs, result } = await captureLogs(async () => {
        // Redirect stdout and stderr for pyodide
        pyodideInstance.setStdout({ batched: (msg: string) => console.log(msg) });
        pyodideInstance.setStderr({ batched: (msg: string) => console.error(msg) });
        return await pyodideInstance.runPythonAsync(code);
      });
      
      output = logs.join('\n');
      if (result !== undefined) {
         if (output) output += '\n';
         output += `<- ${String(result)}`;
      }
    }
    else if (language === 'sql') {
      if (!sqlJsInstance) {
        output += 'Loading SQL environment...\n';
        await new Promise<void>((resolve, reject) => {
          if ((window as any).initSqlJs) return resolve();
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load sql.js'));
          document.head.appendChild(script);
        });
        sqlJsInstance = await (window as any).initSqlJs({
          locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        output = '';
      }
      
      const db = new sqlJsInstance.Database();
      const results = db.exec(code);
      
      if (results && results.length > 0) {
        // Format as a simple ASCII table
        for (const result of results) {
          const columns = result.columns;
          const values = result.values;
          
          output += columns.join(' | ') + '\n';
          output += '-'.repeat(columns.join(' | ').length) + '\n';
          
          for (const row of values) {
            output += row.join(' | ') + '\n';
          }
          output += '\n';
        }
      } else {
        output = 'Query executed successfully. (No results to display)';
      }
      db.close();
    }
  } catch (err: any) {
    errorStr = err.toString();
  }

  const executionTime = Math.round(performance.now() - startTime);
  
  return {
    output,
    error: errorStr,
    executionTime
  };
};

export const STARTER_TEMPLATES: Record<SupportedLanguage, string> = {
  javascript: `// Welcome to the JavaScript Code Lab!
console.log("Hello, Student!");

function calculateArea(radius) {
  return Math.PI * radius * radius;
}

const area = calculateArea(5);
console.log("Area of circle with radius 5:", area.toFixed(2));
`,
  html: `<!-- Welcome to the HTML/CSS Code Lab! -->
<!DOCTYPE html>
<html lang="en">
<head>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f0f4f8;
    }
    .card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
    }
    h1 { color: #2563eb; margin-top: 0; }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.2s;
    }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello, HTML! 🌐</h1>
    <p>Edit this code to see live changes.</p>
    <button onclick="alert('Button clicked!')">Click Me!</button>
  </div>
</body>
</html>
`,
  python: `# Welcome to the Python Code Lab!
print("Hello from Pyodide!")

def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

print("Fibonacci of 10 is:", fibonacci(10))

# Try importing some standard libraries!
import math
print("Square root of 144 is:", math.sqrt(144))
`,
  sql: `-- Welcome to the SQL Code Lab!
-- SQLite syntax is supported.

CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  grade INTEGER,
  course TEXT
);

INSERT INTO students (name, grade, course) VALUES 
  ('Ahmed', 95, 'Mathematics'),
  ('Sarah', 88, 'Physics'),
  ('Omar', 92, 'Computer Science'),
  ('Laila', 98, 'Biology');

-- Select students with grades above 90
SELECT name, course, grade 
FROM students 
WHERE grade > 90 
ORDER BY grade DESC;
`
};
