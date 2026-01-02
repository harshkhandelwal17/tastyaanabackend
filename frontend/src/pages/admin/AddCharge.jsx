import React, { useState } from "react";
import { useCreateChargeMutation } from "../../features/charges/chargesApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import ChargeForm from "../../features/charges/ChargeForm";

const AddCharge = () => {
  const navigate = useNavigate();
  const [createCharge, { isLoading }] = useCreateChargeMutation();
  const [error, setError] = useState("");

  const handleSubmit = async (data) => {
    try {
      await createCharge(data).unwrap();
      toast.success("Charge created successfully");
      navigate("/admin/charges");
    } catch (err) {
      console.error("Error creating charge:", err);
      setError(err?.data?.message || "Failed to create charge");
      toast.error(error || "Failed to create charge");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add New Charge</h1>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <ChargeForm onSubmit={handleSubmit} isSubmitting={isLoading} />
    </div>
  );
};

export default AddCharge;
