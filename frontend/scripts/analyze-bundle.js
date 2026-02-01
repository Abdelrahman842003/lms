#!/usr/bin/env node

/**
 * Bundle Analyzer Script
 * Analyze and report bundle size and composition
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'cyan');
  console.log('='.repeat(60));
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  logHeader('📦 Bundle Analysis Starting...');

  const buildDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(buildDir)) {
    log('❌ Build directory not found. Please run "npm run build" first.', 'red');
    process.exit(1);
  }

  // Build with analyzer
  log('🔍 Building with bundle analyzer...', 'blue');
  
  try {
    execSync('npm run build', { 
      stdio: 'inherit',
      env: { ...process.env, ANALYZE: 'true' }
    });
    
    log('✅ Bundle analysis complete!', 'green');
  } catch (error) {
    log('❌ Build failed:', 'red');
    console.error(error.message);
    process.exit(1);
  }

  // Analyze build output
  analyzeBuildOutput();
}

function analyzeBuildOutput() {
  logHeader('📊 Bundle Size Report');

  const nextDir = path.join(process.cwd(), '.next');
  const staticDir = path.join(nextDir, 'static');
  
  if (!fs.existsSync(staticDir)) {
    log('❌ Static directory not found', 'red');
    return;
  }

  let totalSize = 0;
  const files = [];

  function walkDir(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath, path.join(prefix, item));
      } else if (item.endsWith('.js') || item.endsWith('.css')) {
        const size = stat.size;
        totalSize += size;
        files.push({
          name: path.join(prefix, item),
          size: size,
          type: item.endsWith('.js') ? 'JS' : 'CSS'
        });
      }
    }
  }

  walkDir(staticDir);

  // Sort files by size
  files.sort((a, b) => b.size - a.size);

  // Display results
  log(`📁 Total bundle size: ${formatBytes(totalSize)}`, 'bright');
  console.log();

  // Top 10 largest files
  log('🎯 Top 10 largest files:', 'yellow');
  console.log('─'.repeat(80));
  console.log('Size'.padEnd(12) + 'Type'.padEnd(6) + 'File');
  console.log('─'.repeat(80));

  files.slice(0, 10).forEach(file => {
    const sizeStr = formatBytes(file.size);
    const color = file.size > 500000 ? 'red' : file.size > 100000 ? 'yellow' : 'green';
    const typeColor = file.type === 'JS' ? 'blue' : 'magenta';
    
    console.log(
      `${colors[color]}${sizeStr.padEnd(12)}${colors.reset}` +
      `${colors[typeColor]}${file.type.padEnd(6)}${colors.reset}` +
      file.name
    );
  });

  // Size breakdown
  console.log();
  log('📈 Size breakdown by type:', 'cyan');
  
  const jsFiles = files.filter(f => f.type === 'JS');
  const cssFiles = files.filter(f => f.type === 'CSS');
  
  const jsSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
  const cssSize = cssFiles.reduce((sum, f) => sum + f.size, 0);
  
  console.log(`JavaScript: ${formatBytes(jsSize)} (${((jsSize/totalSize)*100).toFixed(1)}%)`);
  console.log(`CSS:        ${formatBytes(cssSize)} (${((cssSize/totalSize)*100).toFixed(1)}%)`);

  // Recommendations
  console.log();
  log('💡 Recommendations:', 'green');
  
  if (totalSize > 5000000) { // > 5MB
    log('  ⚠️  Bundle size is quite large. Consider:', 'yellow');
    log('     • Code splitting with dynamic imports', 'white');
    log('     • Tree shaking optimization', 'white');
    log('     • Removing unused dependencies', 'white');
  }
  
  const largeFiles = files.filter(f => f.size > 1000000); // > 1MB
  if (largeFiles.length > 0) {
    log(`  📦 ${largeFiles.length} files are larger than 1MB`, 'yellow');
    log('     • Consider chunking or lazy loading', 'white');
  }

  // Generate report file
  generateReport(files, totalSize);
}

function generateReport(files, totalSize) {
  const report = {
    timestamp: new Date().toISOString(),
    totalSize: totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    fileCount: files.length,
    files: files.map(f => ({
      ...f,
      sizeFormatted: formatBytes(f.size),
      percentage: ((f.size / totalSize) * 100).toFixed(2)
    })),
    breakdown: {
      js: {
        count: files.filter(f => f.type === 'JS').length,
        size: files.filter(f => f.type === 'JS').reduce((sum, f) => sum + f.size, 0)
      },
      css: {
        count: files.filter(f => f.type === 'CSS').length,
        size: files.filter(f => f.type === 'CSS').reduce((sum, f) => sum + f.size, 0)
      }
    }
  };

  const reportPath = path.join(process.cwd(), 'bundle-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`📄 Detailed report saved to: ${reportPath}`, 'green');
}

// Run the analyzer
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle, formatBytes };