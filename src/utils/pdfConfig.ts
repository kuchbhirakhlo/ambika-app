'use client';

// Import jsPDF with type fallbacks to prevent build errors
let jsPDF: any;

// Use dynamic import for client-side only code
if (typeof window !== 'undefined') {
  try {
    // Try to import the module
    const jspdfModule = require('jspdf');
    jsPDF = jspdfModule.jsPDF;
    require('jspdf-autotable');
  } catch (error) {
    console.error('Error loading jsPDF:', error);
    // Provide a fallback if import fails
    jsPDF = class MockJsPDF {
      constructor() {
        console.warn('Using mock jsPDF');
      }
      autoTable() {
        return this;
      }
      save() {
        console.warn('PDF save not available');
      }
    };
  }
}

// Helper function for PDF export
export const createPDF = () => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot create PDF in server environment');
  }
  return new jsPDF();
};

export { jsPDF };
export default jsPDF; 