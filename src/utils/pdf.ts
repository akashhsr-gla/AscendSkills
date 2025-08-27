/**
 * Professional Sky Blue PDF Export Utility for Ascend Skills
 * Complete drop-in replacement with elegant sky blue theme
 * Uses html2canvas and jsPDF installed as npm packages for reliable PDF generation
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PDFOptions {
  title?: string;
  fileName?: string;
  headerContent?: string;
  footerContent?: string;
}

export async function downloadElementAsPDF(
  element: HTMLElement,
  filename: string,
  options: PDFOptions = {}
): Promise<void> {
  try {
    console.log('Starting professional sky blue PDF generation with installed libraries...');
    console.log('Element dimensions:', {
      width: element.scrollWidth,
      height: element.scrollHeight,
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight
    });

    // Create a clone of the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Apply professional sky blue PDF-specific styles
    applyPDFStyles(clonedElement);
    
    // Add the cloned element to the DOM temporarily
    document.body.appendChild(clonedElement);
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.width = '800px'; // Fixed width for consistent rendering
    
    try {
      console.log('Starting html2canvas conversion...');
      // Capture the element as canvas with high quality settings
      const canvas = await html2canvas(clonedElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: clonedElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: clonedElement.scrollHeight,
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        ignoreElements: (element: any) => {
          // Ignore elements that might cause issues
          return (
            element.classList.contains('pdf-ignore') ||
                 element.style.display === 'none' ||
            element.style.visibility === 'hidden'
          );
        }
      });

      console.log('Canvas created successfully:', {
        width: canvas.width,
        height: canvas.height
      });

      // Create PDF with proper dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      console.log('PDF dimensions calculated:', {
        imgWidth,
        imgHeight,
        pageHeight,
        heightLeft,
        totalPages: Math.ceil(imgHeight / pageHeight)
      });

      // Initialize jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      console.log('jsPDF instance created successfully');
      
      const totalPages = Math.ceil(imgHeight / pageHeight);
      let currentPage = 1;
      
      // Add header to first page if (options.title)
      if (options.title) {
        console.log('Adding professional sky blue header with title:', options.title);
        addHeaderToPage(pdf, options.title);
      }

      // Add first page
      console.log('Adding first page image...');
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add footer to first page
      addFooterToPage(pdf, currentPage, totalPages);

      // Add subsequent pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        currentPage++;
        console.log(`Adding page ${currentPage}...`);
        pdf.addPage();
        
        // Add header to subsequent pages
        if (options.title) {
          addHeaderToPage(pdf, options.title);
        }
        
        pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add footer to subsequent pages
        addFooterToPage(pdf, currentPage, totalPages);
      }

      console.log(`Professional sky blue PDF created with ${totalPages} pages, saving...`);
      // Save the PDF
      pdf.save(filename);
      console.log('Professional PDF generated and saved successfully!');
    } finally {
      // Clean up the cloned element
      document.body.removeChild(clonedElement);
      console.log('Cleanup completed');
    }
  } catch (error) {
    console.error('Error generating professional PDF:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw new Error(
      `Failed to generate professional PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function applyPDFStyles(element: HTMLElement): void {
  // Create professional sky blue PDF-optimized styles
  const style = document.createElement('style');
  style.textContent = `
    /* Professional Sky Blue Theme - No Gradients, Solid Colors */
    * {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif !important;
      line-height: 1.6 !important;
      box-sizing: border-box !important;
    }
    /* Clean white background - no gradients */
    body {
      background: #ffffff !important;
      color: #1e293b !important;
      margin: 0 !important;
      padding: 20px !important;
    }
    ...
    /* Professional badges */
    .badge, .label, [class*="badge"], [class*="tag"] {
      background: #dbeafe !important;
      color: #1e40af !important;
      padding: 4px 12px !important;
      border-radius: 20px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      border: 1px solid #93c5fd !important;
    }
  `;
  element.appendChild(style);
  
  // Apply additional styles to specific elements
  const allElements = element.querySelectorAll('*');
  allElements.forEach((el: any) => {
    // Remove any CSS custom properties that might cause issues
    el.style.removeProperty('--tw-bg-opacity');
    el.style.removeProperty('--tw-text-opacity');
    el.style.removeProperty('--tw-border-opacity');
    
    // Ensure text is visible and professional
    if (el.style.color && el.style.color.includes('rgba')) {
      el.style.color = '#1e293b';
    }
    
    // Ensure backgrounds are solid and clean
    if (el.style.backgroundColor && el.style.backgroundColor.includes('rgba')) {
      el.style.backgroundColor = '#ffffff';
    }
    
    // Add professional styling to cards
    if (el.classList.contains('bg-white') || el.classList.contains('bg-gray-50')) {
      el.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.1)';
      el.style.borderRadius = '12px';
      el.style.border = '2px solid #e0f2fe';
    }
  });
}

function addHeaderToPage(pdf: any, title: string): void {
  try {
    // Professional sky blue header background - solid color
    pdf.setFillColor(3, 105, 161); // Sky blue primary
    pdf.rect(0, 0, 210, 35, 'F');
    
    // Secondary accent stripe
    pdf.setFillColor(14, 165, 233); // Lighter sky blue
    pdf.rect(0, 35, 210, 3, 'F');
    
    // Add Ascend Skills branding
  pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
    pdf.text('ASCEND SKILLS', 20, 22);
  
    // Add professional subtitle
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Professional Assessment Platform', 20, 30);
    
    // Add main title with professional styling
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(3, 105, 161); // Sky blue text
    pdf.text(title, 105, 55, { align: 'center' });
    
    // Add professional decorative line under title
    pdf.setDrawColor(14, 165, 233); // Sky blue line
    pdf.setLineWidth(1);
    pdf.line(50, 58, 160, 58);
    
    // Add decorative elements
    pdf.setFillColor(14, 165, 233);
    pdf.rect(48, 57, 2, 2, 'F');
    pdf.rect(160, 57, 2, 2, 'F');
    
    // Reset text color and font for content
    pdf.setTextColor(30, 41, 59); // Professional dark gray for content
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
    // Set Y position for content to avoid header overlap
    pdf.setY(75);
    
    console.log('Professional sky blue header added successfully to PDF');
  } catch (error) {
    console.warn('Error adding header to PDF:', error);
    // Continue without header if there's an error
  }
}

// Add professional footer to each page
function addFooterToPage(pdf: any, pageNumber: number, totalPages: number): void {
  try {
    const footerY = 285; // Position from top
    
    // Add professional decorative line above footer
    pdf.setDrawColor(224, 242, 254); // Light sky blue line
    pdf.setLineWidth(1);
    pdf.line(15, footerY, 195, footerY);
    
    // Professional page number styling
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(85, footerY + 3, 40, 8, 2, 2, 'F');
    
    // Add page numbers with sky blue styling
    pdf.setTextColor(3, 105, 161); // Sky blue
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${pageNumber} / ${totalPages}`, 105, footerY + 8, { align: 'center' });
    
    // Add professional company info
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(8);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, footerY + 8);
    pdf.text('Confidential Report', 195, footerY + 8, { align: 'right' });
    
    // Add professional contact info
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(7);
    pdf.text('© Ascend Skills Platform • www.ascendskills.com', 105, footerY + 12, {
      align: 'center'
    });
  } catch (error) {
    console.warn('Error adding footer to PDF:', error);
  }
}

// Add professional section divider with sky blue styling
function addSectionDivider(pdf: any, sectionTitle: string, yPosition: number): number {
  try {
    // Professional section background
    pdf.setFillColor(240, 249, 255); // Light sky blue background
    pdf.rect(15, yPosition, 180, 15, 'F');
    
    // Professional border
    pdf.setDrawColor(14, 165, 233);
    pdf.setLineWidth(0.5);
    pdf.rect(15, yPosition, 180, 15);
    
    // Sky blue accent bar
    pdf.setFillColor(3, 105, 161);
    pdf.rect(15, yPosition, 4, 15, 'F');
    
    // Add section title text
    pdf.setTextColor(3, 105, 161); // Sky blue text
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(sectionTitle, 22, yPosition + 9);
    
    return yPosition + 25; // Return new Y position
  } catch (error) {
    console.warn('Error adding section divider:', error);
    return yPosition + 20;
  }
}

// Add professional score card with sky blue styling
function addScoreCard(
  pdf: any,
  label: string,
  score: number,
  x: number,
  y: number,
  width: number
): void {
  try {
    // Determine professional color based on score
    let borderColor, fillColor;
    if (score >= 80) {
      borderColor = [5, 150, 105]; // Green
      fillColor = [220, 252, 231];
    } else if (score >= 70) {
      borderColor = [14, 165, 233]; // Sky blue  
      fillColor = [240, 249, 255];
    } else if (score >= 60) {
      borderColor = [217, 119, 6]; // Orange
      fillColor = [255, 237, 213];
    } else {
      borderColor = [220, 38, 38]; // Red
      fillColor = [254, 226, 226];
    }
    
    // Professional card background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, width, 25, 3, 3, 'F');
    
    // Professional border
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.setLineWidth(1);
    pdf.roundedRect(x, y, width, 25, 3, 3);
    
    // Top accent stripe
    pdf.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.roundedRect(x, y, width, 3, 3, 3, 'F');
    
    // Add score label
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, x + width / 2, y + 21, { align: 'center' });
    
    // Add score with professional styling
    pdf.setTextColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${score}%`, x + width / 2, y + 15, { align: 'center' });
  } catch (error) {
    console.warn('Error adding score card:', error);
  }
}

// Add professional question card with sky blue styling
function addQuestionCard(
  pdf: any,
  question: string,
  response: string,
  yPosition: number
): number {
  try {
    const cardWidth = 170;
    const cardX = 20;
    let currentY = yPosition;
    
    // Professional question background
    pdf.setFillColor(240, 249, 255); // Light sky blue
    pdf.rect(cardX, currentY, cardWidth, 15, 'F');
    
    // Professional question border
    pdf.setDrawColor(14, 165, 233);
    pdf.setLineWidth(0.5);
    pdf.rect(cardX, currentY, cardWidth, 15);
    
    // Add question text with professional styling
    pdf.setTextColor(3, 105, 161); // Sky blue
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    
    // Split question into multiple lines if needed
    const questionLines = pdf.splitTextToSize(question, cardWidth - 10);
    pdf.text(questionLines, cardX + 5, currentY + 8);
    
    currentY += Math.max(15, questionLines.length * 8) + 5;
    
    // Professional response background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(cardX, currentY, cardWidth, 20, 'F');
    
    // Professional response border
    pdf.setDrawColor(186, 230, 253); // Light sky blue border
    pdf.setLineWidth(0.3);
    pdf.rect(cardX, currentY, cardWidth, 20);
    
    // Sky blue left accent
    pdf.setFillColor(56, 189, 248);
    pdf.rect(cardX, currentY, 4, 20, 'F');
    
    // Add response text
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Split response into multiple lines if needed
    const responseLines = pdf.splitTextToSize(response, cardWidth - 15);
    pdf.text(responseLines, cardX + 8, currentY + 8);
    
    currentY += Math.max(20, responseLines.length * 8) + 10;
    
    return currentY;
  } catch (error) {
    console.warn('Error adding question card:', error);
    return yPosition + 40;
  }
}

// Helper function to add page breaks
export function addPageBreak(element: HTMLElement) {
  const pageBreak = document.createElement('div');
  pageBreak.style.pageBreakBefore = 'always';
  pageBreak.style.breakBefore = 'page';
  pageBreak.className = 'page-break';
  element.appendChild(pageBreak);
}

// Helper function to check if element will fit on current page
export function willElementFit(element: HTMLElement, maxHeight: number): boolean {
  return element.scrollHeight <= maxHeight;
}

// Helper function to split element into pages
export function splitElementIntoPages(
  element: HTMLElement,
  maxHeight: number
): HTMLElement[] {
  const pages: HTMLElement[] = [];
  const children = Array.from(element.children);
  let currentPage = document.createElement('div');
  let currentHeight = 0;
  
  children.forEach(child => {
    const childHeight = (child as HTMLElement).scrollHeight;
    if (currentHeight + childHeight > maxHeight) {
      pages.push(currentPage);
      currentPage = document.createElement('div');
      currentHeight = 0;
    }
    currentPage.appendChild(child.cloneNode(true));
    currentHeight += childHeight;
  });
  
  if (currentPage.children.length > 0) {
    pages.push(currentPage);
  }
  
  return pages;
}
