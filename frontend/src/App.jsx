import { Routes, Route } from "react-router-dom";

import CreateQuotation from "./pages/CreateQuotation";
import CreateInvoice from "./pages/CreateInvoice";
import CreateReceipt from "./pages/CreateReceipt";

function App() {
  return (
    <Routes>
      <Route path="/" element={<CreateQuotation />} />
      <Route path="/create-invoice" element={<CreateInvoice />} />
      <Route path="/create-receipt" element={<CreateReceipt />} />
    </Routes>
  );
}

export default App;
