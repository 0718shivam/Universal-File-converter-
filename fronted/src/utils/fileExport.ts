// File Export Utilities for OCR

export const fileExport = {
  // Export as plain text file
  exportAsTxt(text: string, filename: string = 'extracted_text.txt'): void {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    this.downloadBlob(blob, filename);
  },

  // Export as DOCX (simplified - creates a basic Word document)
  exportAsDocx(text: string, filename: string = 'extracted_text.docx'): void {
    // Simple DOCX format using XML
    const docxContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${this.escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:wordDocument>`;

    const blob = new Blob([docxContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    this.downloadBlob(blob, filename);
  },

  // Export as PDF (using simple HTML to PDF conversion)
  exportAsPdf(text: string): void {
    // Create a simple HTML page and print to PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OCR Extracted Text</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                line-height: 1.6;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>
            ${this.escapeHtml(text)}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  },

  // Helper: Download blob as file
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Helper: Escape XML special characters
  escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  // Helper: Escape HTML special characters
  escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  },
};
