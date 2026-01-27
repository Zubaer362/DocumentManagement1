import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DocumentPreview from "../components/DocumentPreview";

const CreateReceipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceId = new URLSearchParams(location.search).get("invoiceId");
  
  const [invoice, setInvoice] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [payment, setPayment] = useState({
    amount: "",
    method: "Cash",
    transactionId: "",
  });

  // Fetch invoice data
  useEffect(() => {
    if (!invoiceId) return;

    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/invoices/${invoiceId}`);
        if (!res.ok) throw new Error("Invoice not found");
        const data = await res.json();
        setInvoice(data);
        // Set default payment amount to invoice total
        setPayment(prev => ({
          ...prev,
          amount: data.totalAmount || ""
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  // Create receipt from invoice
  const createReceiptFromInvoice = async () => {
    if (!invoice) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/receipts/from-invoice/${invoiceId}`);
      if (!res.ok) throw new Error("Failed to create receipt");
      const data = await res.json();
      setReceipt(data);
      
      // Update local invoice status
      setInvoice(prev => ({ ...prev, status: "Paid" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for custom receipt
  const handleSubmitReceipt = async (e) => {
    e.preventDefault();
    
    if (!invoice) return;

    const receiptData = {
      invoiceId: invoice.invoiceId,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      amountPaid: parseFloat(payment.amount),
      paymentMethod: payment.method,
      transactionId: payment.transactionId || undefined,
    };

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptData),
      });
      
      if (!res.ok) throw new Error("Failed to create receipt");
      
      const data = await res.json();
      setReceipt(data);
      
      // Update local invoice status
      const newStatus = parseFloat(payment.amount) >= invoice.totalAmount ? "Paid" : "Partially Paid";
      setInvoice(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Email receipt function
  const emailReceipt = async () => {
    if (!receipt) return;
    
    setEmailLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/receipts/${receipt.receiptId}/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.message || "Receipt PDF generated successfully!"}\n\nClient email: ${receipt.clientEmail}\nReceipt ID: ${receipt.receiptId}`);
      } else {
        alert(`Failed to process receipt: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error emailing receipt:", err);
      alert("Error processing receipt. Please check console for details.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Download receipt function - PDF version
  const downloadReceipt = async () => {
    if (!receipt) return;
    
    setDownloadLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/receipts/${receipt.receiptId}/pdf`);
      
      if (!response.ok) {
        // Try to get error message
        try {
          const errorText = await response.text();
          if (errorText.includes('<!DOCTYPE')) {
            throw new Error("Server returned HTML instead of PDF. Check backend routes.");
          }
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
        }
      }
      
      // Check if response is PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error("Server did not return a PDF file");
      }
      
      // Get the filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Receipt-${receipt.receiptId}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      
      // Verify blob is PDF
      if (blob.size === 0) {
        throw new Error("Received empty PDF file");
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Show success message
        alert(`✅ Receipt downloaded successfully!\n\nFile: ${filename}\nSize: ${(blob.size / 1024).toFixed(2)} KB`);
      }, 100);
      
    } catch (err) {
      console.error("Error downloading receipt:", err);
      
      // Fallback: Create a simple text file with receipt data
      try {
        const receiptText = `
========================================
            PAYMENT RECEIPT
========================================
Receipt ID: ${receipt.receiptId}
Invoice ID: ${receipt.invoiceId}
Date: ${new Date(receipt.date || new Date()).toLocaleDateString()}

Client: ${receipt.clientName}
Email: ${receipt.clientEmail}

Amount Paid: ${receipt.amountPaid}
Payment Method: ${receipt.paymentMethod}
${receipt.transactionId ? `Transaction ID: ${receipt.transactionId}` : ''}

Status: PAID
========================================
Thank you for your business!
        `.trim();
        
        const blob = new Blob([receiptText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt-${receipt.receiptId}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert(`PDF download failed. Downloaded as text file instead.\n\nError: ${err.message}`);
      } catch (fallbackError) {
        alert(`Error: ${err.message}\n\nAlso failed to create text file: ${fallbackError.message}`);
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  if (!invoiceId) {
    return <p className="p-6 text-red-600">Invoice ID missing</p>;
  }

  if (loading && !invoice) {
    return <p className="p-6">Loading invoice details...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">Error: {error}</p>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Receipt</h1>
      
      {/* Show invoice preview */}
      {invoice && (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Invoice Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Invoice ID:</strong> {invoice.invoiceId}</p>
              <p><strong>Client:</strong> {invoice.clientName}</p>
              <p><strong>Email:</strong> {invoice.clientEmail}</p>
            </div>
            <div>
              <p><strong>Total Amount:</strong> {invoice.totalAmount}</p>
              <p><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${invoice.status === "Paid" ? "bg-green-100 text-green-800" : invoice.status === "Partially Paid" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                  {invoice.status || "Unpaid"}
                </span>
              </p>
              {invoice.quotationId && (
                <p><strong>Quotation ID:</strong> {invoice.quotationId}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Form (show if no receipt created yet) */}
      {!receipt && invoice && (
        <div className="bg-white p-6 shadow-lg rounded-lg mb-8 border">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Payment Details</h2>
          
          <form onSubmit={handleSubmitReceipt} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Amount Paid </label>
                <input
                  type="number"
                  step="0.01"
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={payment.amount}
                  onChange={(e) => setPayment({...payment, amount: e.target.value})}
                  required
                  min="0"
                  placeholder="Enter amount"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Invoice total: <span className="font-semibold">{invoice.totalAmount}</span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Payment Method</label>
                <select
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={payment.method}
                  onChange={(e) => setPayment({...payment, method: e.target.value})}
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">Bkash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online Payment">Online Payment</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Transaction ID (Optional)</label>
              <input
                type="text"
                className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={payment.transactionId}
                onChange={(e) => setPayment({...payment, transactionId: e.target.value})}
                placeholder="e.g., TXN123456, UPI Ref No., Cheque No."
              />
            </div>
            
            {/* Validation messages */}
            {payment.amount && invoice.totalAmount && parseFloat(payment.amount) > invoice.totalAmount && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700">
                   <strong>Note:</strong> Payment amount ({payment.amount}) exceeds invoice total ({invoice.totalAmount}). 
                  This will be recorded as overpayment.
                </p>
              </div>
            )}
            
            {payment.amount && invoice.totalAmount && parseFloat(payment.amount) < invoice.totalAmount && parseFloat(payment.amount) > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700">
                  💡 <strong>Note:</strong> Payment amount ({payment.amount}) is less than invoice total ({invoice.totalAmount}). 
                  Invoice will be marked as <span className="font-semibold">Partially Paid</span>.
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Creating Receipt...
                  </>
                ) : (
                  'Create Receipt'
                )}
              </button>
              
              <button
                type="button"
                onClick={createReceiptFromInvoice}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Pay Full Amount ({invoice.totalAmount})
              </button>
              
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition duration-200"
              >
                ← Back
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Show receipt preview after creation */}
      {receipt && (
        <>
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">✅ Receipt Created Successfully!</h2>
                <div className="space-y-1">
                  <p className="text-green-700"><strong>Receipt ID:</strong> {receipt.receiptId}</p>
                  <p className="text-green-700"><strong>Amount Paid:</strong> {receipt.amountPaid}</p>
                  <p className="text-green-700"><strong>Payment Method:</strong> {receipt.paymentMethod}</p>
                  <p className="text-green-700"><strong>Date:</strong> {new Date(receipt.date || new Date()).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                PAID
              </div>
            </div>
          </div>
          
          {/* Receipt Preview */}
         <DocumentPreview
      title="Payment Receipt"
      idLabel="Receipt ID"
      data={{
        // Receipt data
        id: receipt.receiptId,
        date: receipt.date || new Date(),
        client_name: receipt.clientName || invoice?.clientName || "",
        client_email: receipt.clientEmail || invoice?.clientEmail || "",
        amount_paid: receipt.amountPaid,
        payment_method: receipt.paymentMethod,
        transaction_id: receipt.transactionId,
        invoice_id: receipt.invoiceId,
        
        // CRITICAL: Pass invoice data for services and totals
        services: invoice?.services || [],
        subtotal: invoice?.subtotal || 0,
        discount: invoice?.discount || 0,
        tax_percent: invoice?.tax || 0,
        total_amount: invoice?.totalAmount || 0,
        
        // Optional: Pass client address/phone if available
        client_address: invoice?.clientAddress || "",
        client_phone: invoice?.clientPhone || "",
      }}
    />

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 p-6 bg-gray-50 rounded-lg">
            {/* <button
              onClick={emailReceipt}
              disabled={emailLoading}
              className={`${emailLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-3 rounded-lg flex items-center gap-3 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px] justify-center`}
            >
              {emailLoading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Email Receipt
                </>
              )}
            </button> */}
            
            <button
              onClick={downloadReceipt}
              disabled={downloadLoading}
              className={`${downloadLoading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} text-white px-8 py-3 rounded-lg flex items-center gap-3 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px] justify-center`}
            >
              {downloadLoading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Download PDF
                </>
              )}
            </button>
            
            <button
              onClick={() => navigate("/")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg flex items-center gap-3 transition duration-200 min-w-[180px] justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              Back to Home
            </button>
          </div>
          
          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p> The receipt PDF includes all service details, payment information, and professional formatting.</p>
            <p className="mt-1"> PDF files are saved in the backend <code>pdfs/receipts/</code> folder.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default CreateReceipt;