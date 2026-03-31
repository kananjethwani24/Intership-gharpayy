const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\kanan\\Desktop\\GharPayy Internship\\Gharpayy_Dashboard_Copy\\app\\inventory\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The error is in the closing sequence of the dialog
// Let's replace the problematic block with a clean, correctly formatted version
const badBlock = /<\/PiPViewer>\s*<\/DialogContent>\s*<\/Dialog>/;
if (badBlock.test(content)) {
  content = content.replace(badBlock, 
`        <PiPViewer 
          isOpen={showPdfViewer && hasPdf} 
          onClose={() => setShowPdfViewer(false)} 
          pdfUrl={pdfBlobUrl || brochureData} 
          filename={\`\${selectedProperty.name} Brochure\`}
        />
      </DialogContent>
    </Dialog>`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Cleanup complete.');
} else {
  console.log('Problem block not found with regex, trying alternate...');
  // Fallback: manually find and fix the closing tags to ensure no stray text
  const lines = content.split(/\r?\n/);
  for (let i = 1400; i < lines.length; i++) {
    if (lines[i] && lines[i].includes('</DialogContent>')) {
        lines[i] = '      </DialogContent>';
        if (lines[i-1] && lines[i-1].trim() === '') lines.splice(i-1, 1);
        break;
    }
  }
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Fallback cleanup applied.');
}
