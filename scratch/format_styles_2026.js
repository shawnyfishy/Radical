const fs = require('fs');

const path = 'C:\\Users\\dhana\\.gemini\\antigravity-ide\\brain\\780d5583-98f2-411d-9dee-0a6750a3d52f\\.system_generated\\steps\\1194\\content.md';
const cssContent = fs.readFileSync(path, 'utf8');

const cssStart = cssContent.indexOf('---');
let rawCss = cssContent;
if (cssStart !== -1) {
  rawCss = cssContent.substring(cssStart + 3).trim();
}

const blocks = rawCss.split('}');
let formatted = '';

for (const block of blocks) {
  if (!block.trim()) continue;
  const parts = block.split('{');
  if (parts.length < 2) continue;
  const selectors = parts[0].trim();
  const declarations = parts[1].trim();
  
  const formattedDec = declarations.split(';').map(d => d.trim()).filter(d => d).join(';\n  ');
  formatted += `${selectors} {\n  ${formattedDec};\n}\n\n`;
}

fs.writeFileSync('scratch/formatted_styles_2026.css', formatted, 'utf8');
console.log('Saved formatted CSS to scratch/formatted_styles_2026.css, total blocks:', blocks.length);
