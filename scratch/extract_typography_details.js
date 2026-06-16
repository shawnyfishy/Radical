const fs = require('fs');

const content = fs.readFileSync('scratch/pretty_typography.txt', 'utf8');
const sections = content.split('\n[');

let report = '';

for (const section of sections) {
  if (!section.trim()) continue;
  const lines = section.split('\n');
  const selector = lines[0].replace(/\]$/, '').trim();
  const rules = lines.slice(1).map(l => l.trim()).filter(l => l);
  
  const rulesStr = rules.join('; ');
  if (rulesStr.includes('Ppneuemontreal') || rulesStr.includes('Ppeditorial')) {
    report += `Selector: ${selector}\n`;
    for (const rule of rules) {
      report += `  ${rule}\n`;
    }
    report += '\n';
  }
}

fs.writeFileSync('scratch/typography_rules_report.txt', report, 'utf8');
console.log('Saved report to scratch/typography_rules_report.txt');
