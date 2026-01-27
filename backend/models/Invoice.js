import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  invoiceId: String,
  quotationId: String,

  clientName: String,
  clientEmail: String,

  services: Array,

  subtotal: Number,
  tax: Number,
  discount: Number,
  totalAmount: Number,

  status: {
    type: String,
    default: "Unpaid",
  },
}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema);
