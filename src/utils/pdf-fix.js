"use client";

// This is a JavaScript file to avoid TypeScript issues with jsPDF

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
    // Dynamic imports - load both modules
    const { jsPDF } = await import('jspdf');
    
    // Import jspdf-autotable and get the default export (the autoTable function)
    const jspdfAutotable = await import('jspdf-autotable');
    const autoTable = jspdfAutotable.default || jspdfAutotable;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title || 'Report', 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Use autotable to create the table
    const tableOptions = {
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
    };

    // Call autoTable with doc and options
    autoTable(doc, tableOptions);
    
    // Save the PDF
    doc.save(fileName || 'report.pdf');
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
};
