const fs = require('fs');

const path = 'C:\\Users\\dhana\\.gemini\\antigravity-ide\\brain\\780d5583-98f2-411d-9dee-0a6750a3d52f\\.system_generated\\steps\\1200\\content.md';
const cssContent = fs.readFileSync(path, 'utf8');

// Split CSS by '}' to get each rule block
const blocks = cssContent.split('}');
let output = '';

for (const block of blocks) {
  if (!block.trim()) continue;
  const parts = block.split('{');
  if (parts.length < 2) continue;
  const selectors = parts[0].trim();
  const declarations = parts[1].trim();

  // We are interested in typography classes, text-styles, nav, headers, buttons, etc.
  if (selectors.includes('u-text-style') || 
      selectors.includes('hero') || 
      selectors.includes('nav') || 
      selectors.includes('btn') || 
      selectors.includes('button') || 
      selectors.includes('card') || 
      selectors.includes('footer') || 
      selectors.includes('title') || 
      selectors.includes('pdp') ||
      selectors.match(/^(h1|h2|h3|h4|h5|h6|p|a|body)/)) {
        
    // Format declarations so it's readable
    const formattedDec = declarations.split(';').map(d => d.trim()).filter(d => d).join(';\n  ');
    output += `${selectors} {\n  ${formattedDec};\n}\n\n`;
  }
}

fs.writeFileSync('scratch/typography_rules_full.txt', output, 'utf8');
console.log('Saved report to scratch/typography_rules_full.txt');
