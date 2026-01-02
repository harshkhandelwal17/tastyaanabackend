import React from "react";
import {
  FaExclamationTriangle,
  FaTimes,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";

const DeliveryConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  deliveryCount = 1,
  deliveryDetails = null,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const isMultiple = deliveryCount > 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-6 w-6 text-yellow-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Delivery Completion
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              {isMultiple
                ? `Are you sure you want to mark ${deliveryCount} deliveries as completed?`
                : "Are you sure you want to mark this delivery as completed?"}
            </p>

            {deliveryDetails && !isMultiple && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Customer:</span>{" "}
                  {deliveryDetails.customerName}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Address:</span>{" "}
                  {deliveryDetails.address}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Shift:</span>{" "}
                  {deliveryDetails.shift}
                </p>
              </div>
            )}

            {isMultiple && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">💡 Tip:</span> This action will
                  mark all selected deliveries as completed. Make sure you have
                  delivered to all customers before confirming.
                </p>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
            <div className="flex">
              <FaExclamationTriangle className="h-4 w-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-yellow-700">
                  <strong>Important:</strong> This action cannot be undone. Only
                  confirm if the
                  {isMultiple ? " deliveries have" : " delivery has"} been
                  completed successfully.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                Processing...
              </>
            ) : (
              <>
                <FaCheck className="h-4 w-4 mr-2" />
                {isMultiple
                  ? `Complete ${deliveryCount} Deliveries`
                  : "Complete Delivery"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryConfirmationDialog;
