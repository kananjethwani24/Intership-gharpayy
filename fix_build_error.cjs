const fs = require('fs');
const filePath = 'c:\\Users\\kanan\\Desktop\\GharPayy Internship\\Gharpayy_Dashboard_Copy\\app\\inventory\\page.tsx';
let c = fs.readFileSync(filePath, 'utf8');

// Find the precise blocks and normalize them to remove stray JSX text
const oldBlock = /<PiPViewer[\s\S]*?filename=\{\`\$\{selectedProperty\.name\} Brochure\`\}[\s\S]*?\/>\s*<\/DialogContent>/;
const newBlock = `<PiPViewer 
          isOpen={showPdfViewer && hasPdf} 
          onClose={() => setShowPdfViewer(false)} 
          pdfUrl={pdfBlobUrl || brochureData} 
          filename={\`\${selectedProperty.name} Brochure\`}
        />
      </DialogContent>`;

if (oldBlock.test(c)) {
    c = c.replace(oldBlock, newBlock);
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Surgical fix applied.');
} else {
    console.log('Block not found, trying multi-line anchor fix...');
    const parts = c.split('filename={`' + "${selectedProperty.name} Brochure`}");
    if (parts.length > 1) {
        const after = parts[1].replace(/^[\s\S]*?<\/DialogContent>/, 
` filename={\`\${selectedProperty.name} Brochure\`}
        />
      </DialogContent>`);
        fs.writeFileSync(filePath, parts[0] + after, 'utf8');
        console.log('Anchor fix applied.');
    }
}
