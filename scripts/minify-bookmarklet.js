// Simple minifier for bookmarklet code
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../src/bookmarklet-enhanced.js');
const target = path.join(__dirname, '../src/bookmarklet-simple.html');

let code = fs.readFileSync(source, 'utf8');

// Remove comments
code = code.replace(/\/\*[\s\S]*?\*\//g, '');
code = code.replace(/\/\/.*/g, '');

// Remove unnecessary whitespace
code = code.replace(/\s+/g, ' ');
code = code.replace(/\s*([{}();,:])\s*/g, '$1');
code = code.replace(/;\s*}/g, '}');

// Trim
code = code.trim();

// Wrap in javascript: protocol
const bookmarklet = 'javascript:' + encodeURIComponent(code).replace(/%20/g, ' ');

console.log('✅ Bookmarklet minified!');
console.log(`📊 Original: ${fs.readFileSync(source, 'utf8').length} chars`);
console.log(`📊 Minified: ${code.length} chars`);
console.log(`📊 Encoded: ${bookmarklet.length} chars`);
console.log('\n📋 Copy this into bookmarklet-simple.html:');
console.log('\n' + bookmarklet);

// Also save to clipboard-ready file
fs.writeFileSync(
  path.join(__dirname, '../src/bookmarklet-minified.txt'),
  bookmarklet
);
console.log('\n✅ Saved to: src/bookmarklet-minified.txt');
