const fs = require('fs');

const webflowContent = fs.readFileSync('scratch/formatted_webflow.css', 'utf8');
const customContent = fs.readFileSync('scratch/formatted_styles_2026.css', 'utf8');

const allContent = webflowContent + '\n\n' + customContent;

// Split by blocks (double newline)
const blocks = allContent.split('\n\n');

let report = '';

function checkSelector(selector) {
  const s = selector.toLowerCase();
  return (
    s.includes('u-text-style-') ||
    s.includes('hero') ||
    s.includes('nav') ||
    s.includes('btn') ||
    s.includes('button') ||
    s.includes('footer') ||
    s.includes('card') ||
    s.includes('title') ||
    s.includes('pdp') ||
    s.match(/^(h1|h2|h3|h4|h5|h6|p|a|body)/)
  );
}

for (const block of blocks) {
  if (!block.trim()) continue;
  const lines = block.split('\n');
  const selector = lines[0].replace(/\{$/, '').trim();
  
  if (checkSelector(selector)) {
    // Check if it contains typography properties
    const rules = lines.slice(1).map(l => l.trim()).filter(l => l);
    const hasTypo = rules.some(r => 
      r.includes('font-') || 
      r.includes('letter-spacing') || 
      r.includes('line-height') || 
      r.includes('text-transform') ||
      r.includes('--')
    );
    
    if (hasTypo) {
      report += `${selector} {\n`;
      for (const rule of rules) {
        report += `  ${rule}\n`;
      }
      report += `}\n\n`;
    }
  }
}

fs.writeFileSync('scratch/typography_audit_analysis.txt', report, 'utf8');
console.log('Saved typography analysis to scratch/typography_audit_analysis.txt');
