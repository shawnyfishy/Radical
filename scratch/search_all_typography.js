const fs = require('fs');

const path1 = 'C:\\Users\\dhana\\.gemini\\antigravity-ide\\brain\\780d5583-98f2-411d-9dee-0a6750a3d52f\\.system_generated\\steps\\1200\\content.md';
const path2 = 'C:\\Users\\dhana\\.gemini\\antigravity-ide\\brain\\780d5583-98f2-411d-9dee-0a6750a3d52f\\.system_generated\\steps\\1194\\content.md';

const content1 = fs.readFileSync(path1, 'utf8');
const content2 = fs.readFileSync(path2, 'utf8');

const parseCss = (content) => {
  const cssStart = content.indexOf('---');
  let rawCss = content;
  if (cssStart !== -1) {
    rawCss = content.substring(cssStart + 3).trim();
  }
  const blocks = rawCss.split('}');
  let results = [];
  for (const block of blocks) {
    if (!block.trim()) continue;
    const parts = block.split('{');
    if (parts.length < 2) continue;
    const selectors = parts[0].trim();
    const declarations = parts[1].trim();
    
    // Check if contains typography
    if (declarations.includes('font') || 
        declarations.includes('letter-spacing') || 
        declarations.includes('line-height') || 
        declarations.includes('text-transform')) {
      results.push({ selectors, declarations });
    }
  }
  return results;
};

const rules1 = parseCss(content1);
const rules2 = parseCss(content2);

let output = '=== FILE 1: odd-ritual-gc.webflow.css ===\n\n';
for (const rule of rules1) {
  const decs = rule.declarations.split(';').map(d => d.trim()).filter(d => d).join(';\n  ');
  output += `${rule.selectors} {\n  ${decs};\n}\n\n`;
}

output += '\n\n=== FILE 2: styles-2026.css ===\n\n';
for (const rule of rules2) {
  const decs = rule.declarations.split(';').map(d => d.trim()).filter(d => d).join(';\n  ');
  output += `${rule.selectors} {\n  ${decs};\n}\n\n`;
}

fs.writeFileSync('scratch/typography_rules_comprehensive.txt', output, 'utf8');
console.log('Saved comprehensive report. File 1 count:', rules1.length, 'File 2 count:', rules2.length);
