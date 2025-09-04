/**
 * Structured PDF Generation for Ascend Skills
 * Creates professional PDFs using jsPDF with manual content generation
 * No screenshots - pure PDF generation with theme colors and structured layout
 */

import jsPDF from 'jspdf';

// Theme colors (Ascend Skills brand colors)
const COLORS = {
  primary: {
    main: '#0369a1',     // Blue-700
    light: '#0ea5e9',    // Blue-500
    lightest: '#dbeafe', // Blue-100
    dark: '#1e40af'      // Blue-800
  },
  secondary: {
    main: '#7c3aed',     // Purple-600
    light: '#a855f7',    // Purple-500
    lightest: '#e9d5ff', // Purple-100
    dark: '#5b21b6'      // Purple-800
  },
  accent: {
    main: '#059669',     // Green-600
    light: '#10b981',    // Green-500
    lightest: '#d1fae5', // Green-100
    dark: '#047857'      // Green-700
  },
  gray: {
    dark: '#1f2937',     // Gray-800
    medium: '#6b7280',   // Gray-500
    light: '#f3f4f6',    // Gray-100
    white: '#ffffff'
  },
  status: {
    success: '#059669',  // Green-600
    warning: '#d97706',  // Amber-600
    error: '#dc2626',    // Red-600
    info: '#0369a1'      // Blue-700
  }
};

// Helper functions for color conversion
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const setColor = (pdf: jsPDF, color: string) => {
  const rgb = hexToRgb(color);
  return [rgb.r, rgb.g, rgb.b] as [number, number, number];
};

interface PDFOptions {
  title?: string;
  subtitle?: string;
  author?: string;
  subject?: string;
}

export class StructuredPDFGenerator {
  private pdf: jsPDF;
  public currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number = 20;
  private lineHeight: number = 7;

  constructor(options: PDFOptions = {}) {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    
    // Set document properties
    if (options.title) this.pdf.setProperties({ title: options.title });
    if (options.author) this.pdf.setProperties({ author: options.author || 'Ascend Skills' });
    if (options.subject) this.pdf.setProperties({ subject: options.subject });
    
    this.currentY = this.margin;
  }

  // Check if we need a new page
  private checkPageBreak(contentHeight: number = 10): boolean {
    if (this.currentY + contentHeight > this.pageHeight - this.margin) {
      this.addPage();
      return true;
    }
    return false;
  }

  // Add a new page
  private addPage(): void {
    this.pdf.addPage();
    this.currentY = this.margin;
    this.addHeader();
  }

  // Add header to each page
  public addHeader(): void {
    const headerHeight = 25;
    
    // Header background
    this.pdf.setFillColor(...setColor(this.pdf, COLORS.primary.main));
    this.pdf.rect(0, 0, this.pageWidth, headerHeight, 'F');
    
    // Logo area (placeholder)
    this.pdf.setFillColor(...setColor(this.pdf, COLORS.gray.white));
    this.pdf.rect(this.margin, 5, 15, 15, 'F');
    
    // Company name
    this.pdf.setTextColor(...setColor(this.pdf, COLORS.gray.white));
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('ASCEND SKILLS', this.margin + 20, 15);
    
    // Tagline
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Professional Assessment Platform', this.margin + 20, 19);
    
    // Date
    this.pdf.setFontSize(8);
    this.pdf.text(`Generated: ${new Date().toLocaleDateString()}`, this.pageWidth - this.margin - 30, 15);
    
    this.currentY = headerHeight + 10;
  }

  // Add footer to each page
  private addFooter(): void {
    const footerY = this.pageHeight - 15;
    
    // Footer line
    this.pdf.setDrawColor(...setColor(this.pdf, COLORS.primary.lightest));
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    // Page number
    this.pdf.setTextColor(...setColor(this.pdf, COLORS.gray.medium));
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    const pageNum = this.pdf.getCurrentPageInfo().pageNumber;
    this.pdf.text(`Page ${pageNum}`, this.pageWidth / 2, footerY, { align: 'center' });
    
    // Company info
    this.pdf.text('© Ascend Skills Platform • www.ascendskills.com', this.pageWidth / 2, footerY + 4, { align: 'center' });
  }

  // Add main title
  addTitle(title: string, subtitle?: string): void {
    this.checkPageBreak(20);
    
    // Title background
    this.pdf.setFillColor(...setColor(this.pdf, COLORS.primary.lightest));
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 'F');
    
    // Title
    this.pdf.setTextColor(...setColor(this.pdf, COLORS.primary.dark));
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.pageWidth / 2, this.currentY + 12, { align: 'center' });
    
    if (subtitle) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(subtitle, this.pageWidth / 2, this.currentY + 20, { align: 'center' });
    }
    
    this.currentY += 35;
  }

  // Add section header
  addSection(title: string, icon?: string): void {
    this.checkPageBreak(15);
    
    // Section background
    this.pdf.setFillColor(...setColor(this.pdf, COLORS.secondary.lightest));
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 'F');
    
    // Section border
    this.pdf.setDrawColor(...setColor(this.pdf, COLORS.secondary.main));
    this.pdf.setLineWidth(1);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12);
    
    // Section title
    this.pdf.setTextColor(...setColor(this.pdf, COLORS.secondary.dark));
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin + 5, this.currentY + 8);
    
    this.currentY += 20;
  }

  // Add score card
  addScoreCard(label: string, score: number, x: number, y: number, width: number = 40): void {
    const height = 25;
    
    // Determine color based on score
    let color = COLORS.status.error;
    if (score >= 80) color = COLORS.status.success;
    else if (score >= 70) color = COLORS.primary.main;
    else if (score >= 60) color = COLORS.status.warning;
    
    // Card background
    this.pdf.setFillColor(...setColor(this.pdf, COLORS.gray.white));
    this.pdf.rect(x, y, width, height, 'F');
    
    // Card border
    this.pdf.setDrawColor(...setColor(this.pdf, color));
    this.pdf.setLineWidth(1);
    this.pdf.rect(x, y, width, height);
    
    // Top accent bar
    this.pdf.setFillColor(...setColor(this.pdf, color));
    this.pdf.rect(x, y, width, 3, 'F');
    
    // Score
    this.pdf.setTextColor(...setColor(this.pdf, color));
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(`${score}%`, x + width / 2, y + 15, { align: 'center' });
    
    // Label
    this.pdf.setTextColor(...setColor(this.pdf, COLORS.gray.dark));
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(label, x + width / 2, y + 22, { align: 'center' });
  }

  // Add text content
  addText(text: string, options: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold' | 'italic';
    color?: string;
    align?: 'left' | 'center' | 'right';
    indent?: number;
  } = {}): void {
    const {
      fontSize = 10,
      fontStyle = 'normal',
      color = COLORS.gray.dark,
      align = 'left',
      indent = 0
    } = options;
    
    this.checkPageBreak(this.lineHeight);
    
    this.pdf.setTextColor(...setColor(this.pdf, color));
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont('helvetica', fontStyle);
    
    const maxWidth = this.pageWidth - 2 * this.margin - indent;
    const lines = this.pdf.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(this.lineHeight);
      
      let x = this.margin + indent;
      if (align === 'center') x = this.pageWidth / 2;
      else if (align === 'right') x = this.pageWidth - this.margin;
      
      this.pdf.text(line, x, this.currentY, { align });
      this.currentY += this.lineHeight;
    });
    
    this.currentY += 2; // Extra spacing
  }

  // Add a list
  addList(items: string[], options: {
    bullet?: string;
    indent?: number;
    fontSize?: number;
  } = {}): void {
    const { bullet = '•', indent = 10, fontSize = 10 } = options;
    
    items.forEach(item => {
      this.checkPageBreak(this.lineHeight);
      
      // Bullet
      this.pdf.setTextColor(...setColor(this.pdf, COLORS.primary.main));
      this.pdf.setFontSize(fontSize);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(bullet, this.margin + indent, this.currentY);
      
      // Text
      this.pdf.setTextColor(...setColor(this.pdf, COLORS.gray.dark));
      this.pdf.setFont('helvetica', 'normal');
      
      const maxWidth = this.pageWidth - 2 * this.margin - indent - 10;
      const lines = this.pdf.splitTextToSize(item, maxWidth);
      
      lines.forEach((line: string, index: number) => {
        if (index > 0) {
          this.checkPageBreak(this.lineHeight);
        }
        this.pdf.text(line, this.margin + indent + 10, this.currentY);
        if (index < lines.length - 1) {
          this.currentY += this.lineHeight;
        }
      });
      
      this.currentY += this.lineHeight + 2;
    });
  }

  // Add table
  addTable(headers: string[], rows: string[][], options: {
    headerColor?: string;
    borderColor?: string;
    fontSize?: number;
  } = {}): void {
    const {
      headerColor = COLORS.primary.main,
      borderColor = COLORS.gray.medium,
      fontSize = 9
    } = options;
    
    const tableWidth = this.pageWidth - 2 * this.margin;
    const colWidth = tableWidth / headers.length;
    const rowHeight = 8;
    
    this.checkPageBreak((rows.length + 1) * rowHeight);
    
    // Header
    this.pdf.setFillColor(...setColor(this.pdf, headerColor));
    this.pdf.rect(this.margin, this.currentY, tableWidth, rowHeight, 'F');
    
    this.pdf.setTextColor(...setColor(this.pdf, COLORS.gray.white));
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont('helvetica', 'bold');
    
    headers.forEach((header, index) => {
      this.pdf.text(header, this.margin + index * colWidth + 2, this.currentY + 5);
    });
    
    this.currentY += rowHeight;
    
    // Rows
    this.pdf.setTextColor(...setColor(this.pdf, COLORS.gray.dark));
    this.pdf.setFont('helvetica', 'normal');
    
    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(rowHeight);
      
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        this.pdf.setFillColor(...setColor(this.pdf, COLORS.gray.light));
        this.pdf.rect(this.margin, this.currentY, tableWidth, rowHeight, 'F');
      }
      
      row.forEach((cell, colIndex) => {
        this.pdf.text(cell, this.margin + colIndex * colWidth + 2, this.currentY + 5);
      });
      
      this.currentY += rowHeight;
    });
    
    // Table border
    this.pdf.setDrawColor(...setColor(this.pdf, borderColor));
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.margin, this.currentY - (rows.length + 1) * rowHeight, tableWidth, (rows.length + 1) * rowHeight);
    
    this.currentY += 5;
  }

  // Add space
  addSpace(height: number = 10): void {
    this.currentY += height;
  }

  // Finalize and return PDF
  finalize(): jsPDF {
    // Add footer to all pages
    const totalPages = this.pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.addFooter();
    }
    
    return this.pdf;
  }

  // Save PDF
  save(filename: string): void {
    const finalPdf = this.finalize();
    finalPdf.save(filename);
  }

  // Get PDF blob
  getBlob(): Blob {
    const finalPdf = this.finalize();
    return finalPdf.output('blob');
  }
}

export default StructuredPDFGenerator;
