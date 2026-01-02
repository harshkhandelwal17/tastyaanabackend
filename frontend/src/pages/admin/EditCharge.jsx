import React, { useEffect, useState } from "react";
import {
  useGetChargeQuery,
  useUpdateChargeMutation,
} from "../../features/charges/chargesApi";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import ChargeForm from "../../features/charges/ChargeForm";
import { Loader2 } from "lucide-react";

const EditCharge = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const {
    data: charge,
    isLoading: isLoadingCharge,
    isError: isChargeError,
    error: chargeError,
  } = useGetChargeQuery(id);

  const [updateCharge, { isLoading: isUpdating }] = useUpdateChargeMutation();

  const handleSubmit = async (data) => {
    try {
      await updateCharge({ id, ...data }).unwrap();
      toast.success("Charge updated successfully");
      navigate("/admin/charges");
    } catch (err) {
      console.error("Error updating charge:", err);
      setError(err?.data?.message || "Failed to update charge");
      toast.error(error || "Failed to update charge");
    }
  };

  if (isLoadingCharge) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isChargeError) {
    return (
      <div className="p-4 text-red-600">
        {chargeError?.data?.message || "Error loading charge details"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Charge</h1>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <ChargeForm
        onSubmit={handleSubmit}
        defaultValues={charge?.data}
        isSubmitting={isUpdating}
        isEdit={true}
      />
    </div>
  );
};

export default EditCharge;
