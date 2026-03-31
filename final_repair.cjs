const fs = require('fs');
const path = 'app/inventory/page.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Find the line that starts the iframe
const sliceIndex = lines.findIndex(l => l.includes('<iframe'));
if (sliceIndex !== -1) {
    const head = lines.slice(0, sliceIndex);
    const tail = [
        "      <div className='flex-1 bg-slate-950'><iframe src={pdfUrl} className='w-full h-full border-none' title='PiP Viewer' /></div>",
        "    </motion.div>",
        "  );",
        "}"
    ];
    fs.writeFileSync(path, head.concat(tail).join('\n'), 'utf8');
    console.log('Final build repair successful.');
} else {
    console.log('Iframe not found.');
}
