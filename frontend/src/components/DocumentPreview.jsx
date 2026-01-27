const DocumentPreview = ({ title, idLabel, data }) => {
  if (!data) return null;

  return (
    <div className="mt-8 bg-white p-6 shadow border">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      {/* BASIC INFO */}
      <p>
        <strong>{idLabel}:</strong> {data.id}
      </p>
      <p>
        <strong>Date:</strong>{" "}
        {new Date(data.date).toDateString()}
      </p>

      <hr className="my-4" />

      {/* CLIENT INFO */}
      <p>
        <strong>Quotation To:</strong> {data.client_name}
      </p>
      <p>{data.client_address}</p>
      <p>{data.client_phone}</p>
      <p>{data.client_email}</p>

      {/* SERVICES TABLE */}
      <table className="w-full mt-4 border text-sm">
        <thead>
          <tr className="border bg-gray-100">
            <th className="border p-2 text-left">Item</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.services?.map((s, i) => (
            <tr key={i}>
              <td className="border p-2">{s.description}</td>
              <td className="border p-2 text-center">{s.quantity}</td>
              <td className="border p-2 text-right">{s.price}</td>
              <td className="border p-2 text-right">
                {s.quantity * s.price}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS */}
      <div className="mt-4 text-sm text-right">
        <p>Sub Total: {data.subtotal}</p>
        <p>Discount: −{data.discount ?? 0}</p>
        <p>Tax (%): {data.tax_percent ?? 0}</p>
        <p className="font-bold text-lg">
          Total: {data.total_amount}
        </p>
      </div>

      {/* TERMS */}
      {data.terms_conditions && (
        <div className="mt-4 text-sm">
          <strong>Terms & Conditions</strong>
          <p className="mt-1">{data.terms_conditions}</p>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;
