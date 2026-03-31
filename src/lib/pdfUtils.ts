import * as pdfjs from 'pdfjs-dist';

// For version 2.x, the worker is configured like this
if (typeof window !== 'undefined') {
  // Use a local worker path if possible, or CDN
  (pdfjs as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export async function pdfToImages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  // In v2.x, it's pdfjs.getDocument
  const loadingTask = (pdfjs as any).getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const images: string[] = [];

  const numPages = Math.min(pdf.numPages, 10);
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await (page as any).render({ canvasContext: context, viewport, canvas }).promise;
    
    images.push(canvas.toDataURL('image/jpeg', 0.6));
  }

  return images;
}
