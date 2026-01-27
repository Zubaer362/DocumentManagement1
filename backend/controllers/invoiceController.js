import Invoice from "../models/Invoice.js";
import Quotation from "../models/Quotation.js";
import { generateId } from "../utils/generateId.js";
import { generatePDF } from "../utils/pdfGenerator.js";
// import { sendEmail } from "../utils/emailSender.js"; // Uncomment when ready

// Get invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ invoiceId: req.params.id });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create invoice from quotation
export const createInvoiceFromQuotation = async (req, res) => {
  try {
    const { quotationId } = req.params;
    
    // Find the quotation
    const quotation = await Quotation.findOne({ quotationId });
    
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Count existing invoices
    const count = await Invoice.countDocuments();
    const invoiceId = generateId("AT-I", count + 1);

    // Create invoice from quotation data
    const invoice = new Invoice({
      invoiceId,
      quotationId: quotation.quotationId,
      clientName: quotation.clientName,
      clientEmail: quotation.clientEmail,
      services: quotation.services,
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      tax: quotation.tax,
      totalAmount: quotation.totalAmount,
      status: "Unpaid",
    });

    const savedInvoice = await invoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Email invoice
export const emailInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findOne({ invoiceId: id });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Generate PDF
    const pdfPath = await generatePDF("invoice", invoice);
    
    // For testing - return success without actually sending email
    res.json({ 
      success: true,
      message: "Invoice would be emailed here",
      clientEmail: invoice.clientEmail,
      invoiceId: invoice.invoiceId,
      pdfPath: pdfPath
    });
    
    // Uncomment this when email is configured:
    // await sendEmail(invoice.clientEmail, `Invoice ${invoice.invoiceId}`, "Please find your invoice attached.", pdfPath);
    // res.json({ message: "Invoice emailed successfully" });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download invoice PDF
export const downloadInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findOne({ invoiceId: id });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Generate PDF
    const pdfPath = await generatePDF("invoice", invoice);
    
    // Send the file
    res.download(pdfPath, `Invoice-${invoice.invoiceId}.pdf`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create invoice (direct)
export const createInvoice = async (req, res) => {
  try {
    const count = await Invoice.countDocuments();
    const invoiceId = generateId("AT-I", count + 1);

    const invoice = new Invoice({
      ...req.body,
      invoiceId,
    });

    const savedInvoice = await invoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};