const fs = require('fs');
const path = 'app/inventory/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Reconstruct the file around the PiPViewer area with 100% precision
const start = lines.slice(0, 1408);
const middle = [
    '        <PiPViewer ',
    '          isOpen={showPdfViewer && hasPdf} ',
    '          onClose={() => setShowPdfViewer(false)} ',
    '          pdfUrl={pdfBlobUrl || brochureData} ',
    '          filename={`${selectedProperty.name} Brochure`}',
    '        />',
    '      </DialogContent>'
];
const end = lines.slice(lines.findIndex(l => l.includes('</Dialog>'), 1400));

fs.writeFileSync(path, [...start, ...middle, ...end].join('\n'), 'utf8');
console.log('Absolute rewrite complete.');
