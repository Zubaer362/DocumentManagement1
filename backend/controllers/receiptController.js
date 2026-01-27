import Receipt from "../models/Receipt.js";
import Invoice from "../models/Invoice.js";
import { generateId } from "../utils/generateId.js";
import { generatePDF } from "../utils/pdfGenerator.js";

// Create receipt from invoice
export const createReceiptFromInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Find the invoice
    const invoice = await Invoice.findOne({ invoiceId });
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Count existing receipts
    const count = await Receipt.countDocuments();
    const receiptId = generateId("AT-R", count + 1);

    // Create receipt from invoice data
    const receipt = new Receipt({
      receiptId,
      invoiceId: invoice.invoiceId,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      amountPaid: invoice.totalAmount,
      paymentMethod: "Cash",
      date: new Date(),
    });

    const savedReceipt = await receipt.save();
    
    // Update invoice status
    invoice.status = "Paid";
    await invoice.save();
    
    res.status(201).json(savedReceipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download receipt PDF
export const downloadReceiptPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findOne({ receiptId: id });
    
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Get the related invoice for service details
    const invoice = await Invoice.findOne({ invoiceId: receipt.invoiceId });
    
    // Prepare data for PDF generation
    const pdfData = {
      ...receipt.toObject(),
      services: invoice?.services || [],
      subtotal: invoice?.subtotal || 0,
      discount: invoice?.discount || 0,
      tax: invoice?.tax || 0,
      totalAmount: invoice?.totalAmount || 0,
    };

    // Generate PDF
    const pdfPath = await generatePDF("receipt", pdfData);
    
    // Send the file
    res.download(pdfPath, `Receipt-${receipt.receiptId}.pdf`, (err) => {
      if (err) {
        console.error("Error sending PDF:", err);
        // Fallback: send as attachment
        res.download(pdfPath);
      }
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Email receipt (placeholder for now)
export const emailReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findOne({ receiptId: id });
    
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Get invoice for context
    const invoice = await Invoice.findOne({ invoiceId: receipt.invoiceId });
    const pdfData = {
      ...receipt.toObject(),
      services: invoice?.services || [],
      subtotal: invoice?.subtotal || 0,
      discount: invoice?.discount || 0,
      tax: invoice?.tax || 0,
      totalAmount: invoice?.totalAmount || 0,
    };

    // Generate PDF
    const pdfPath = await generatePDF("receipt", pdfData);
    
    res.json({ 
      success: true,
      message: "Receipt PDF generated successfully",
      receiptId: receipt.receiptId,
      pdfPath: pdfPath
      // Note: Actual email sending code would go here
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create receipt (direct)
export const createReceipt = async (req, res) => {
  try {
    const count = await Receipt.countDocuments();
    const receiptId = generateId("AT-R", count + 1);

    const receipt = new Receipt({
      ...req.body,
      receiptId,
    });

    const savedReceipt = await receipt.save();
    
    // Update invoice status if invoiceId exists
    if (req.body.invoiceId) {
      const invoice = await Invoice.findOne({ invoiceId: req.body.invoiceId });
      if (invoice) {
        invoice.status = parseFloat(req.body.amountPaid) >= invoice.totalAmount ? "Paid" : "Partially Paid";
        await invoice.save();
      }
    }
    
    res.status(201).json(savedReceipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get receipt by ID
export const getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ receiptId: req.params.id });
    
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};