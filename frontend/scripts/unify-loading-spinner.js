#!/usr/bin/env node
/**
 * Script to unify all loading spinners across the frontend
 * Replaces fa-spinner, animate-spin divs, and custom spinners with LoadingSpinner component
 */

const fs = require('fs');
const path = require('path');

// Find all .tsx and .ts files recursively
function findFiles(dir, extensions = ['.tsx', '.ts']) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Check if file has loading patterns
function hasLoadingPatterns(content) {
  const patterns = [
    /fa-spinner/,                           // FontAwesome spinner
    /fa-circle-notch/,                      // FontAwesome circle spinner
    /fa-sync.*spin/,                        // FontAwesome sync spinner
    /animate-spin.*rounded-full/,           // Custom CSS spinners
    /rounded-full.*animate-spin/,           // Custom CSS spinners (reversed)
    /border-.*border-t-transparent.*animate-spin/, // Border spinners
  ];
  return patterns.some(pattern => pattern.test(content));
}

// Add import for LoadingSpinner if not present
function addImport(content) {
  // Check if already imported
  if (content.includes('LoadingSpinner')) {
    return content;
  }
  
  // Find the last import statement
  const importRegex = /^(import\s+.*?from\s+['"][^'"]+['"];?\s*)$/gm;
  const imports = [...content.matchAll(importRegex)];
  
  if (imports.length === 0) {
    // No imports found, add at the top
    return `import { LoadingSpinner } from '@/components/ui/LoadingSpinner';\n${content}`;
  }
  
  // Add after the last import
  const lastImport = imports[imports.length - 1];
  const insertPos = lastImport.index + lastImport[0].length;
  return content.slice(0, insertPos) + 
         `\nimport { LoadingSpinner } from '@/components/ui/LoadingSpinner';` +
         content.slice(insertPos);
}

// Replace patterns with LoadingSpinner
function replacePatterns(content, filePath) {
  let modified = content;
  const replacements = [];
  
  // Pattern 1: <i className="fas fa-spinner fa-spin"></i> (simple inline)
  const simpleSpinnerRegex = /<i\s+className="[^"]*fas\s+fa-spinner\s+fa-spin[^"]*"\s*\/?>/g;
  modified = modified.replace(simpleSpinnerRegex, (match) => {
    replacements.push({ from: match, to: '<LoadingSpinner size="sm" color="primary" />' });
    return '<LoadingSpinner size="sm" color="primary" />';
  });
  
  // Pattern 2: <i className="fas fa-spinner fa-spin text-xs"></i> (small)
  const smallSpinnerRegex = /<i\s+className="[^"]*fas\s+fa-spinner\s+fa-spin[^"]*text-xs[^"]*"\s*\/?>/g;
  modified = modified.replace(smallSpinnerRegex, (match) => {
    replacements.push({ from: match, to: '<LoadingSpinner size="sm" color="white" />' });
    return '<LoadingSpinner size="sm" color="white" />';
  });
  
  // Pattern 3: <i className="fas fa-spinner fa-spin text-lg"></i> (medium)
  const mediumSpinnerRegex = /<i\s+className="[^"]*fas\s+fa-spinner\s+fa-spin[^"]*text-lg[^"]*"\s*\/?>/g;
  modified = modified.replace(mediumSpinnerRegex, (match) => {
    replacements.push({ from: match, to: '<LoadingSpinner size="md" color="white" />' });
    return '<LoadingSpinner size="md" color="white" />';
  });
  
  // Pattern 4: <i className="fas fa-spinner fa-spin text-4xl text-primary"></i> (large page loaders)
  const largeSpinnerRegex = /<i\s+className="[^"]*fas\s+fa-spinner\s+fa-spin[^"]*text-4xl[^"]*text-primary[^"]*"\s*\/?>/g;
  modified = modified.replace(largeSpinnerRegex, (match) => {
    replacements.push({ from: match, to: '<LoadingSpinner size="xl" color="primary" />' });
    return '<LoadingSpinner size="xl" color="primary" />';
  });
  
  // Pattern 5: <i className="fas fa-spinner fa-spin text-primary"></i> (with primary color)
  const primarySpinnerRegex = /<i\s+className="[^"]*fas\s+fa-spinner\s+fa-spin[^"]*text-primary[^"]*"\s*\/?>/g;
  modified = modified.replace(primarySpinnerRegex, (match) => {
    replacements.push({ from: match, to: '<LoadingSpinner size="sm" color="primary" />' });
    return '<LoadingSpinner size="sm" color="primary" />';
  });
  
  // Pattern 6: Custom animate-spin divs with border
  const customSpinnerRegex = /<div\s+className="[^"]*animate-spin[^"]*rounded-full[^"]*border[^"]*"[^>]*><\/div>/g;
  modified = modified.replace(customSpinnerRegex, (match) => {
    // Determine size based on w-* h-* classes
    const hasLarge = /w-1[02]|h-1[02]/.test(match);
    const size = hasLarge ? 'lg' : 'md';
    replacements.push({ from: match, to: `<LoadingSpinner size="${size}" color="primary" />` });
    return `<LoadingSpinner size="${size}" color="primary" />`;
  });
  
  // Pattern 7: Custom div spinners (reversed order)
  const customSpinnerRegex2 = /<div\s+className="[^"]*rounded-full[^"]*animate-spin[^"]*border[^"]*"[^>]*><\/div>/g;
  modified = modified.replace(customSpinnerRegex2, (match) => {
    const hasLarge = /w-1[02]|h-1[02]/.test(match);
    const size = hasLarge ? 'lg' : 'md';
    replacements.push({ from: match, to: `<LoadingSpinner size="${size}" color="primary" />` });
    return `<LoadingSpinner size="${size}" color="primary" />`;
  });
  
  // Pattern 8: fa-sync-alt fa-spin
  const syncSpinnerRegex = /<i\s+className="[^"]*fa-sync-alt\s+fa-spin[^"]*"\s*\/?>/g;
  modified = modified.replace(syncSpinnerRegex, (match) => {
    replacements.push({ from: match, to: '<LoadingSpinner size="sm" color="primary" />' });
    return '<LoadingSpinner size="sm" color="primary" />';
  });
  
  return { content: modified, replacements };
}

// Main execution
function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  console.log(`Found ${files.length} files to scan`);
  
  const modifiedFiles = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    if (!hasLoadingPatterns(content)) {
      continue;
    }
    
    console.log(`\n📄 ${path.relative(srcDir, file)}`);
    
    // Add import
    let modified = addImport(content);
    
    // Replace patterns
    const result = replacePatterns(modified, file);
    modified = result.content;
    
    if (result.replacements.length > 0) {
      console.log(`  ✓ ${result.replacements.length} replacements:`);
      result.replacements.forEach(r => {
        console.log(`    - ${r.from.substring(0, 60)}... → ${r.to}`);
      });
      
      fs.writeFileSync(file, modified, 'utf-8');
      modifiedFiles.push({
        file: path.relative(srcDir, file),
        replacements: result.replacements.length
      });
    }
  }
  
  console.log(`\n\n✅ Completed! Modified ${modifiedFiles.length} files:`);
  modifiedFiles.forEach(f => {
    console.log(`  - ${f.file} (${f.replacements} changes)`);
  });
}

main();
