import { useState, useEffect, useRef } from "react"; // CHANGED: Added useRef
import { useNavigate } from "react-router-dom";
import ServicesTable from "../components/ServicesTable";
import DocumentPreview from "../components/DocumentPreview";

const CreateQuotation = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [quotation, setQuotation] = useState(null);

  const [client, setClient] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(5);
  const [terms, setTerms] = useState("");

  // CHANGED: Added ref for scrolling to preview
  const previewRef = useRef(null);

  const subtotal = services.reduce(
    (sum, s) => sum + s.quantity * s.price,
    0
  );

  const taxAmount = (subtotal * tax) / 100;
  const totalAmount = subtotal + taxAmount - discount;

  // CHANGED: Added scroll effect when quotation is created
  useEffect(() => {
    if (quotation && previewRef.current) {
      // Scroll to the preview section with smooth animation
      previewRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // CHANGED: Also update browser URL to show quotation ID (optional)
      window.history.replaceState(null, '', `?quotation=${quotation.quotationId}`);
    }
  }, [quotation]); // CHANGED: Runs when quotation state changes

  const submitQuotation = async () => {
    const res = await fetch("http://localhost:5000/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: client.name,
        clientAddress: client.address,
        clientPhone: client.phone,
        clientEmail: client.email,
        services,
        subtotal,
        discount,
        tax: tax,
        totalAmount: totalAmount,
        terms: terms,
      }),
    });

    const data = await res.json();
    setQuotation(data);
  };

  return (
    <div className="p-6">
      {/* CHANGED: Added quotation creation status indicator */}
      {!quotation ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800">Create New Quotation</h2>
          <p className="text-blue-600 text-sm mt-1">Fill in the details below to create a quotation</p>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800">✅ Quotation Created Successfully!</h2>
          <p className="text-green-600 text-sm mt-1">Your quotation is ready. Scroll down to view and create an invoice.</p>
        </div>
      )}

      <div className="bg-white p-6 shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Create Quotation</h2>

        {/* CHANGED: Improved client form layout */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-gray-700">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              className="border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Client Name"
              onChange={e => setClient({ ...client, name: e.target.value })} 
            />
            <input 
              className="border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Client Address"
              onChange={e => setClient({ ...client, address: e.target.value })} 
            />
            <input 
              className="border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Client Phone"
              onChange={e => setClient({ ...client, phone: e.target.value })} 
            />
            <input 
              className="border border-gray-300 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Client Email"
              type="email"
              onChange={e => setClient({ ...client, email: e.target.value })} 
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-gray-700">Services / Items</h3>
          <ServicesTable services={services} setServices={setServices} />
        </div>

        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-gray-700">Pricing Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Discount (In BDT)</label>
              <input
                type="number"
                className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tax (%)</label>
              <input
                type="number"
                className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={tax}
                onChange={e => setTax(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* CHANGED: Improved totals display */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium mb-3 text-gray-700">Price Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span className="font-medium text-red-600">−{discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({tax}%):</span>
              <span className="font-medium">{taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Payable:</span>
                <span className="text-blue-600">{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700">Terms & Conditions</label>
          <textarea
            className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter terms and conditions (optional)"
            rows="4"
            value={terms}
            onChange={e => setTerms(e.target.value)}
          />
        </div>

        <button
          onClick={submitQuotation}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200"
        >
          Create Quotation
        </button>
      </div>

      {/* CHANGED: Added ref and improved preview section */}
      {quotation && (
        <div 
          ref={previewRef} // CHANGED: Added ref for scrolling
          className="mt-10 p-1" // CHANGED: Added margin top for separation
        >
          {/* CHANGED: Added preview header */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-blue-800">Quotation Preview</h2>
                <p className="text-blue-600 text-sm">Review your quotation below</p>
              </div>
              <div className="text-sm text-gray-600">
                ID: <span className="font-semibold">{quotation.quotationId}</span>
              </div>
            </div>
          </div>

          <DocumentPreview
            title="Quotation"
            idLabel="Quotation ID"
            data={{
              id: quotation.quotationId,
              date: quotation.createdAt || new Date(),
              client_name: quotation.clientName,
              client_address: quotation.clientAddress,
              client_phone: quotation.clientPhone,
              client_email: quotation.clientEmail,
              services: quotation.services,
              subtotal: quotation.subtotal,
              discount: quotation.discount,
              tax_percent: (quotation.subtotal * quotation.tax) / 100,
              total_amount: quotation.totalAmount,
              terms_conditions: quotation.terms,
            }}
          />

          {/* CHANGED: Improved action buttons section */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-center">Next Steps</h3>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition duration-200 flex items-center justify-center gap-2"
                onClick={() =>
                  navigate(`/create-invoice?quotationId=${quotation.quotationId}`)
                }
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Create Invoice
              </button>
              
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg font-medium transition duration-200 flex items-center justify-center gap-2"
                onClick={() => {
                  // CHANGED: Scroll to top to edit the form
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  // CHANGED: Optionally reset or allow editing
                  alert("Scroll to the top to edit the quotation");
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Edit Quotation
              </button>
              
              <button
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-8 py-3 rounded-lg font-medium transition duration-200 flex items-center justify-center gap-2"
                onClick={() => {
                  // CHANGED: Print the quotation
                  window.print();
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
                Print
              </button>
            </div>
            
            {/* CHANGED: Added helpful text */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Click "Create Invoice" to convert this quotation into an invoice for payment.</p>
            </div>
          </div>
          
          {/* CHANGED: Added scroll indicator */}
          <div className="text-center mt-6">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11l7-7 7 7M5 19l7-7 7 7"></path>
              </svg>
              Back to Top
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuotation;