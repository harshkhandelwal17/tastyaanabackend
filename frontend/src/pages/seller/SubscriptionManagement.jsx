import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetSubscriptionQuery,
  useUpdateSubscriptionMutation,
} from "../../features/subscription/subscriptionApi";
import { toast } from "react-hot-toast";
import EditableSubscriptionForm from "../../features/subscription/EditableSubscriptionForm";
import { format } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";

const SubscriptionManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetSubscriptionQuery(id);

  const [updateSubscription, { isLoading: isUpdating }] =
    useUpdateSubscriptionMutation();

  const subscription = response?.data;

  const handleUpdateSuccess = (updatedSubscription) => {
    toast.success("Subscription updated successfully");
    refetch();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError || !subscription) {
    return (
      <div className="p-4 text-red-600">
        Error loading subscription. Please try again.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" /> Back to Subscriptions
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Subscription #{subscription.subscriptionNumber}
          </h1>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Edit Subscription
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <EditableSubscriptionForm
          subscription={subscription}
          onSuccess={handleUpdateSuccess}
          onCancel={handleCancel}
          isEditing={isEditing}
        />
      </div>
    </div>
  );
};

export default SubscriptionManagement;
