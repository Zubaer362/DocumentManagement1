import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generatePDF = async (type, data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      
      // Create folder if it doesn't exist
      const folder = `pdfs/${type}s`;
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
      
      const filePath = `${folder}/${data[type + "Id"]}.pdf`;
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);
      
      // Header with logo/company name
      doc.fontSize(20).text('Arbeit Tech', { align: "center" });
      doc.fontSize(16).text(type.toUpperCase(), { align: "center" });
      doc.moveDown();
      
      // Document ID and Date
      doc.fontSize(10).text(`${type} ID: ${data[type + "Id"]}`, { align: "left" });
      doc.text(`Date: ${new Date(data.date || data.createdAt).toLocaleDateString('en-IN')}`, { align: "left" });
      
      if (type === "receipt") {
        doc.text(`Invoice ID: ${data.invoiceId}`, { align: "left" });
      }
      
      doc.moveDown(2);
      
      // Draw a line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      
      if (type === "receipt") {
        // Receipt specific content
        doc.fontSize(12).text('RECEIPT DETAILS', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(10).text(`Received from: ${data.clientName}`);
        doc.text(`Email: ${data.clientEmail}`);
        doc.moveDown();
        
        doc.fontSize(12).text('PAYMENT INFORMATION', { underline: true });
        doc.moveDown(0.5);
        
        // Payment table
        const paymentStartY = doc.y;
        doc.fontSize(10);
        doc.text('Amount Paid:', 50, paymentStartY);
        doc.text(`₹${data.amountPaid.toFixed(2)}`, 400, paymentStartY, { align: "right", width: 100 });
        
        doc.text('Payment Method:', 50, paymentStartY + 20);
        doc.text(data.paymentMethod, 400, paymentStartY + 20, { align: "right", width: 100 });
        
        if (data.transactionId) {
          doc.text('Transaction ID:', 50, paymentStartY + 40);
          doc.text(data.transactionId, 400, paymentStartY + 40, { align: "right", width: 100 });
        }
        
        doc.moveDown(3);
        
        // Status badge
        doc.rect(400, doc.y, 150, 30).fillAndStroke('#d4edda', '#c3e6cb');
        doc.fillColor('#155724').fontSize(12).text('PAID', 475, doc.y + 10, { align: "center" });
        doc.moveDown(2);
      }
      
      // Services section (for both invoice and receipt)
      if (data.services && data.services.length > 0) {
        doc.fontSize(12).text('SERVICES / ITEMS', { underline: true });
        doc.moveDown(0.5);
        
        // Table header
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Description', 50, tableTop);
        doc.text('Qty', 300, tableTop);
        doc.text('Rate', 350, tableTop);
        doc.text('Amount', 450, tableTop, { align: "right", width: 100 });
        
        // Draw header line
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        doc.moveDown(1);
        
        // Table rows
        doc.font('Helvetica');
        let yPos = tableTop + 25;
        let total = 0;
        
        data.services.forEach((service, index) => {
          const itemTotal = (service.quantity || 0) * (service.price || 0);
          total += itemTotal;
          
          doc.text(service.description || 'Service', 50, yPos);
          doc.text(String(service.quantity || 0), 300, yPos);
          doc.text(`₹${(service.price || 0).toFixed(2)}`, 350, yPos);
          doc.text(`₹${itemTotal.toFixed(2)}`, 450, yPos, { align: "right", width: 100 });
          
          yPos += 20;
          
          // Break page if needed
          if (yPos > 700 && index < data.services.length - 1) {
            doc.addPage();
            yPos = 50;
          }
        });
        
        doc.y = yPos + 10;
        
        // Summary section
        doc.fontSize(12).text('SUMMARY', { underline: true });
        doc.moveDown(0.5);
        
        const summaryStartY = doc.y;
        doc.fontSize(10);
        
        doc.text('Subtotal:', 400, summaryStartY);
        doc.text(`₹${(data.subtotal || total).toFixed(2)}`, 450, summaryStartY, { align: "right", width: 100 });
        
        doc.text('Discount:', 400, summaryStartY + 20);
        doc.text(`-₹${(data.discount || 0).toFixed(2)}`, 450, summaryStartY + 20, { align: "right", width: 100 });
        
        doc.text(`Tax (${data.tax || 0}%):`, 400, summaryStartY + 40);
        doc.text(`₹${(((data.subtotal || total) * (data.tax || 0)) / 100).toFixed(2)}`, 450, summaryStartY + 40, { align: "right", width: 100 });
        
        // Total line
        doc.moveTo(400, summaryStartY + 60).lineTo(550, summaryStartY + 60).stroke();
        
        doc.font('Helvetica-Bold');
        doc.text('Total:', 400, summaryStartY + 70);
        doc.text(`₹${(data.totalAmount || total).toFixed(2)}`, 450, summaryStartY + 70, { align: "right", width: 100 });
        
        // For receipts, show payment info
        if (type === "receipt") {
          doc.moveDown(2);
          doc.font('Helvetica-Bold').fillColor('#155724');
          doc.text('Amount Paid:', 400, doc.y);
          doc.text(`₹${data.amountPaid.toFixed(2)}`, 450, doc.y, { align: "right", width: 100 });
          
          if (data.amountPaid < data.totalAmount) {
            doc.font('Helvetica').fillColor('#856404');
            doc.text('Balance Due:', 400, doc.y + 20);
            doc.text(`₹${(data.totalAmount - data.amountPaid).toFixed(2)}`, 450, doc.y + 20, { align: "right", width: 100 });
          }
        }
        
        doc.moveDown(3);
      }
      
      // Footer
      const footerY = 750;
      doc.fontSize(8).fillColor('#666666').font('Helvetica');
      doc.text('Thank you for your business!', 50, footerY, { align: "center", width: 500 });
      doc.text('Arbeit • Dhaka, Bangladesh • Contact: 01747579362', 50, footerY + 15, { align: "center", width: 500 });
      
      doc.end();
      
      writeStream.on("finish", () => resolve(filePath));
      writeStream.on("error", reject);
      
    } catch (error) {
      reject(error);
    }
  });
};