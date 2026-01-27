import express from "express";

import { createInvoice,
  createInvoiceFromQuotation,getInvoiceById,
  emailInvoice,  
  downloadInvoicePDF } from "../controllers/invoiceController.js";

const router = express.Router();

router.post("/", createInvoice);
router.get("/:id", getInvoiceById);
router.get("/from-quotation/:quotationId", createInvoiceFromQuotation);
router.post("/:id/email", emailInvoice);
router.get("/:id/pdf", downloadInvoicePDF);

export default router;
