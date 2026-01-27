import express from "express";

import { createReceipt,
  createReceiptFromInvoice, emailReceipt,        // Add this import
  downloadReceiptPDF,  // Add this import
  getReceiptById  } from "../controllers/receiptController.js";

const router = express.Router();

router.post("/", createReceipt);
router.get("/from-invoice/:invoiceId", createReceiptFromInvoice);
router.post("/:id/email", emailReceipt);
router.get("/:id/pdf", downloadReceiptPDF);
router.get("/:id", getReceiptById);  


export default router;
