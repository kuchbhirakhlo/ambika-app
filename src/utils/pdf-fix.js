'use client';

// This is a JavaScript file to avoid TypeScript issues with jsPDF
let jsPDFModule = null;

export const generatePDF = async (
  title,
  headerData,
  rowsData,
  fileName
) => {
  // Only run in the browser
  if (typeof window === 'undefined') {
    console.error('Cannot generate PDF on server');
    return false;
  }
  
  try {
    // Lazy load modules only when needed
    if (!jsPDFModule) {
      // Dynamic imports
      jsPDFModule = await import('jspdf');
      // Import autotable extension
      await import('jspdf-autotable');
    }
    
    // Get the jsPDF constructor
    const { jsPDF } = jsPDFModule;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title || 'Report', 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Use autotable - this will work if jspdf-autotable is properly loaded
    try {
      doc.autoTable({
        startY: 40,
        head: [headerData],
        body: rowsData,
        theme: 'grid',
        headStyles: {
          fillColor: [74, 108, 247],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 244, 255]
        }
      });
    } catch (tableError) {
      console.error('Error creating table:', tableError);
      // Fallback to simple document
      doc.setFontSize(12);
      doc.text('Error creating table. See console for details.', 14, 40);
    }
    
    // Save the PDF
    doc.save(fileName || 'report.pdf');
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}; 