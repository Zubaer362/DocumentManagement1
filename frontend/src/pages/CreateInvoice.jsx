import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DocumentPreview from "../components/DocumentPreview";

const CreateInvoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const quotationId = new URLSearchParams(location.search).get("quotationId");

  useEffect(() => {
    if (!quotationId) return;

    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:5000/api/invoices/from-quotation/${quotationId}`);
        
        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }
        
        const data = await res.json();
        setInvoice(data);
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [quotationId]);

  // Email Invoice function
  const emailInvoice = async () => {
    if (!invoice) return;
    
    setEmailLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/invoices/${invoice.invoiceId}/email`, {
        method: "POST",
      });
      
      if (res.ok) {
        alert("Invoice emailed successfully!");
      } else {
        const errorData = await res.json();
        alert(`Failed to email invoice: ${errorData.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error emailing invoice:", err);
      alert("Error sending email. Please check console for details.");
    } finally {
      setEmailLoading(false);
    }
  };

  // Download Invoice PDF function
  const downloadInvoice = async () => {
    if (!invoice) return;
    
    setDownloadLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/invoices/${invoice.invoiceId}/pdf`);
      
      if (!res.ok) {
        throw new Error(`Failed to download: ${res.status}`);
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoice.invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      alert("Error downloading invoice. The PDF endpoint might not be implemented yet.");
    } finally {
      setDownloadLoading(false);
    }
  };

  if (!quotationId) {
    return <p className="p-6 text-red-600">Quotation ID missing</p>;
  }

  if (loading) {
    return <p className="p-6">Loading invoice...</p>;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Error: {error}</p>
        <p className="text-sm text-gray-600">The invoice endpoint might not be implemented yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {invoice ? (
        <>
          <DocumentPreview
            title="Invoice"
            idLabel="Invoice ID"
            data={{
              id: invoice.invoiceId,
              date: invoice.createdAt || new Date(),
              client_name: invoice.clientName,
              client_email: invoice.clientEmail,
              services: invoice.services,
              subtotal: invoice.subtotal,
              discount: invoice.discount,
              tax_percent: invoice.tax,
              total_amount: invoice.totalAmount,
            }}
          />

          <div className="flex justify-center gap-4 mt-6">
            {/* <button 
              onClick={emailInvoice}
              disabled={emailLoading}
              className={`${emailLoading ? 'bg-blue-400' : 'bg-blue-600'} text-white px-6 py-2 rounded flex items-center gap-2`}
            >
              {emailLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Sending...
                </>
              ) : (
                'Email Invoice'
              )}
            </button> */}
            
            <button 
              onClick={downloadInvoice}
              disabled={downloadLoading}
              className={`${downloadLoading ? 'bg-purple-400' : 'bg-purple-600'} text-white px-6 py-2 rounded flex items-center gap-2`}
            >
              {downloadLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Downloading...
                </>
              ) : (
                'Download Invoice'
              )}
            </button>

            <button
              className="bg-green-600 text-white px-6 py-2 rounded"
              onClick={() =>
                navigate(`/create-receipt?invoiceId=${invoice.invoiceId}`)
              }
            >
              Make Payment
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-600">No invoice data available</p>
      )}
    </div>
  );
};

export default CreateInvoice;