const ServicesTable = ({ services, setServices }) => {

  const addService = () => {
    setServices([
      ...services,
      { description: "", quantity: 1, price: 0 }
    ]);
  };

  const updateService = (index, field, value) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 font-semibold text-sm bg-gray-100 p-2">
        <div>Description</div>
        <div>Quantity</div>
        <div>Price</div>
        <div>Total</div>
        <div></div>
      </div>

      {services.map((s, i) => (
        <div key={i} className="grid grid-cols-5 gap-2">
          <input
            className="border p-2"
            value={s.description}
            onChange={(e) =>
              updateService(i, "description", e.target.value)
            }
          />
          <input
            type="number"
            className="border p-2"
            value={s.quantity}
            onChange={(e) =>
              updateService(i, "quantity", Number(e.target.value))
            }
          />
          <input
            type="number"
            className="border p-2"
            value={s.price}
            onChange={(e) =>
              updateService(i, "price", Number(e.target.value))
            }
          />
          <input
            className="border p-2 bg-gray-100"
            value={s.quantity * s.price}
            readOnly
          />
          <button className="text-xl">+</button>
        </div>
      ))}

      <button
        onClick={addService}
        className="text-blue-600 text-sm"
      >
        Add Service
      </button>
    </div>
  );
};

export default ServicesTable;
