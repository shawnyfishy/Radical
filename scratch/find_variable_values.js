const fs = require('fs');

const path = 'C:\\Users\\dhana\\.gemini\\antigravity-ide\\brain\\780d5583-98f2-411d-9dee-0a6750a3d52f\\.system_generated\\steps\\1200\\content.md';
const cssContent = fs.readFileSync(path, 'utf8');

const regexes = [
  /--_typography---font--primary-family:\s*([^;]+)/,
  /--_typography---font--secondary-family:\s*([^;]+)/,
  /--_typography---font--primary-regular:\s*([^;]+)/,
  /--_typography---font--primary-medium:\s*([^;]+)/,
  /--_typography---font--primary-bold:\s*([^;]+)/
];

for (const regex of regexes) {
  const match = cssContent.match(regex);
  if (match) {
    console.log(`${match[0]}`);
  } else {
    console.log(`No match for ${regex.toString()}`);
  }
}
