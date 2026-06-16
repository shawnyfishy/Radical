const fs = require('fs');

const content = fs.readFileSync('scratch/pretty_typography.txt', 'utf8');
const sections = content.split('\n[');

let output = '';

for (const section of sections) {
  if (!section.trim()) continue;
  const lines = section.split('\n');
  const selector = lines[0].replace(/\]$/, '').trim();
  const rules = lines.slice(1).map(l => l.trim()).filter(l => l);
  
  if (selector.includes('u-text-style') || selector.includes('hero') || selector.includes('nav') || selector.includes('button') || selector.includes('footer') || selector.includes('card') || selector.includes('title') || selector.includes('pdp') || selector.includes('btn')) {
    output += `Selector: ${selector}\n`;
    for (const rule of rules) {
      output += `  ${rule}\n`;
    }
    output += '\n';
  }
}

fs.writeFileSync('scratch/typography_roles_detailed.txt', output, 'utf8');
console.log('Saved report to scratch/typography_roles_detailed.txt');
