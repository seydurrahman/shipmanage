import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function AssetForm() {
  const emptyForm = {
    item: "",
    description: "",
    quantity: "",
    rate: "",
    total_amount: "",
    is_active: true,
  };

  const [formData, setFormData] = useState(emptyForm);
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // =========================
  // AUTO CALCULATE TOTAL
  // =========================
  useEffect(() => {
    const qty = parseFloat(formData.quantity);
    const rate = parseFloat(formData.rate);

    if (!isNaN(qty) && !isNaN(rate)) {
      setFormData((prev) => ({
        ...prev,
        total_amount: (qty * rate).toFixed(2),
      }));
    }
  }, [formData.quantity, formData.rate]);

  // =========================
  // LOAD ASSETS
  // =========================
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get("assets/");
      setAssets(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to load assets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // =========================
  // HANDLERS
  // =========================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (asset) => {
    setFormData({
      item: asset.item,
      description: asset.description || "",
      quantity: asset.quantity,
      rate: asset.rate,
      total_amount: asset.total_amount,
      is_active: asset.is_active,
    });
    setEditingId(asset.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this asset?")) return;
    await api.delete(`assets/${id}/`);
    fetchAssets();
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        rate: Number(formData.rate),
        total_amount: Number(formData.total_amount),
      };

      if (editingId) {
        await api.put(`assets/${editingId}/`, payload);
        alert("Asset updated!");
      } else {
        await api.post("assets/", payload);
        alert("Asset created!");
      }

      resetForm();
      fetchAssets();
      setShowForm(false);
    } catch (err) {
      alert("Error saving asset");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // TOTAL SUMMARY
  // =========================
  const totalAssetValue = assets.reduce(
    (sum, a) => sum + Number(a.total_amount || 0),
    0
  );

  return (
    <div
      style={{
        backgroundImage: `url(/titanic-iceberg.jpg)`,
      }}
      className="min-h-screen w-full overflow-x-hidden bg-slate-900 text-white"
    >
      {showForm ? (
        /* ================= FORM ================= */
        <form
          onSubmit={submit}
          className="glass-card max-w-lg mx-auto p-6 space-y-4"
        >
          <h2 className="text-xl font-bold">
            {editingId ? "Edit Asset" : "Add Asset"}
          </h2>

          <input
            name="item"
            placeholder="Asset Item"
            className="w-full p-2 rounded text-black"
            value={formData.item}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            className="w-full p-2 rounded text-black"
            value={formData.description}
            onChange={handleChange}
          />

          <input
            name="quantity"
            type="number"
            placeholder="Quantity"
            className="w-full p-2 rounded text-black"
            value={formData.quantity}
            onChange={handleChange}
            required
          />

          <input
            name="rate"
            type="number"
            step="0.01"
            placeholder="Rate"
            className="w-full p-2 rounded text-black"
            value={formData.rate}
            onChange={handleChange}
            required
          />

          <input
            value={formData.total_amount}
            disabled
            className="w-full p-2 rounded bg-gray-200 text-black"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            Active
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 py-2 rounded"
            >
              {submitting ? "Saving..." : editingId ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="flex-1 bg-gray-600 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* ================= LIST ================= */
        <div className="glass-card max-w-6xl mx-auto p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">Assets</h2>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 px-3 py-1 rounded"
            >
              + Add Asset
            </button>
          </div>

          <div className="bg-green-900/40 p-3 rounded mb-4">
            <strong>Total Asset Value:</strong> Tk {totalAssetValue.toFixed(2)}
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : assets.length === 0 ? (
            <p>No assets found</p>
          ) : (
            <div className="hidden md:block">
              <table className="w-full border border-white/20">
                <thead className="bg-white/20">
                  <tr>
                    <th className="p-2 text-center align-middle">Item</th>
                    <th className="p-2 text-center align-middle">
                      Description
                    </th>
                    <th className="p-2 text-center align-middle">Qty</th>
                    <th className="p-2 text-center align-middle">
                      Purchase Rate
                    </th>
                    <th className="p-2 text-center align-middle">Total</th>
                    <th className="p-2 text-center align-middle">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id} className="hover:bg-white/10">
                      <td className="p-2 text-center align-middle">{a.item}</td>
                      <td className="p-2 text-center align-middle">
                        {a.description}
                      </td>
                      <td className="p-2 text-center align-middle">
                        {a.quantity}
                      </td>
                      <td className="p-2 text-center align-middle">{a.rate}</td>
                      <td className="p-2 text-center align-middle">
                        {a.total_amount}
                      </td>
                      <td className="p-2 text-center align-middle space-x-2">
                        <button
                          onClick={() => handleEdit(a)}
                          className="px-3 py-1 bg-blue-500 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="px-3 py-1 bg-red-500 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* ================= MOBILE CARD VIEW ================= */}
          <div className="md:hidden w-full px-3 space-y-3">
            {assets.map((a) => (
              <div
                key={a.id}
                className="bg-white/10 p-4 rounded-xl w-full overflow-hidden"
              >
                <div className="space-y-1 text-sm">
                  <p className="break-words">
                    <span className="text-gray-300">Item:</span> {a.item}
                  </p>

                  {a.description && (
                    <p className="break-words">
                      <span className="text-gray-300">Description:</span>{" "}
                      {a.description}
                    </p>
                  )}

                  <p>
                    <span className="text-gray-300">Qty:</span> {a.quantity}
                  </p>

                  <p>
                    <span className="text-gray-300">Rate:</span> {a.rate}
                  </p>

                  <p className="font-semibold text-green-400">
                    Total: Tk {a.total_amount}
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(a)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
