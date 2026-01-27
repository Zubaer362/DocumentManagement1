import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  price: Number,
  total: Number,
});

const quotationSchema = new mongoose.Schema({
  quotationId: String,
  clientName: String,
  clientAddress: String,
  clientPhone: String,
  clientEmail: String,
  services: [serviceSchema],
  subtotal: Number,
  discount: Number,
  tax: Number,
  totalAmount: Number,
  validityDate: Date,
  terms: String,
  status: { type: String, default: "Pending" },
}, { timestamps: true });

export default mongoose.model("Quotation", quotationSchema);
