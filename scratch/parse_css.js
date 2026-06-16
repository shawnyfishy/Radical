const fs = require('fs');

const path = 'C:\\Users\\dhana\\.gemini\\antigravity-ide\\brain\\780d5583-98f2-411d-9dee-0a6750a3d52f\\.system_generated\\steps\\1200\\content.md';
const cssContent = fs.readFileSync(path, 'utf8');

// Replace { with \n{\n, } with \n}\n, and ; with ;\n to make it multi-line
const formatted = cssContent
  .replace(/\{/g, ' {\n  ')
  .replace(/\}/g, '\n}\n')
  .replace(/;/g, ';\n  ');

// Filter lines containing font-family, font-size, font-weight, letter-spacing, line-height
const lines = formatted.split('\n');
let typographyRules = [];
let currentSelector = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.endsWith('{')) {
    currentSelector = line.slice(0, -1).trim();
  }
  if (line.includes('font-family') || line.includes('font-size') || line.includes('font-weight') || line.includes('letter-spacing') || line.includes('line-height') || line.includes('text-transform') || line.includes('@font-face')) {
    // Look up context (current selector)
    typographyRules.push({
      selector: currentSelector,
      rule: line
    });
  }
}

// Print the unique selectors and their typography rules
let output = '';
let lastSelector = '';
for (const item of typographyRules) {
  if (item.selector !== lastSelector) {
    output += `\n[${item.selector}]\n`;
    lastSelector = item.selector;
  }
  output += `  ${item.rule}\n`;
}

fs.writeFileSync('scratch/pretty_typography.txt', output, 'utf8');
console.log('Saved pretty typography to scratch/pretty_typography.txt');
