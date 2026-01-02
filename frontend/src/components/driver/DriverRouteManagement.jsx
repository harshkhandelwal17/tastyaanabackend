import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const DriverRouteManagement = () => {
  const { date, shift } = useParams();
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingStop, setCompletingStop] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);

  useEffect(() => {
    fetchDriverRoute();
  }, [date, shift]);

  const fetchDriverRoute = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/driver/route/${date}/${shift}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setRouteData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch route");
    } finally {
      setLoading(false);
    }
  };

  const startRoute = async () => {
    try {
      await axios.put(
        `/api/driver/route/${routeData.route._id}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchDriverRoute();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start route");
    }
  };

  const completeStop = async (stopId, deliveryData) => {
    try {
      setCompletingStop(stopId);
      await axios.put(
        `/api/driver/route/${routeData.route._id}/complete-stop/${stopId}`,
        deliveryData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchDriverRoute();
      setSelectedStop(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to complete stop");
    } finally {
      setCompletingStop(null);
    }
  };

  const reorderStops = async (newOrder) => {
    try {
      await axios.put(
        `/api/driver/route/${routeData.route._id}/reorder`,
        { stopOrder: newOrder },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchDriverRoute();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reorder stops");
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(routeData.route.stops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const newOrder = items.map((item) => item._id);
    reorderStops(newOrder);
  };

  const renderStopCard = (stop, index) => {
    const isCompleted = stop.status === "delivered";
    const isCurrent =
      !isCompleted && index === routeData.progress?.currentStopIndex;

    return (
      <Draggable
        key={stop._id}
        draggableId={stop._id}
        index={index}
        isDragDisabled={isCompleted}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-white rounded-lg shadow-sm border-2 p-4 mb-3 transition-all ${
              snapshot.isDragging
                ? "shadow-lg border-blue-300"
                : isCompleted
                ? "border-green-200 bg-green-50"
                : isCurrent
                ? "border-blue-300 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    isCompleted
                      ? "bg-green-500"
                      : isCurrent
                      ? "bg-blue-500"
                      : "bg-gray-400"
                  }`}
                >
                  {isCompleted ? "✓" : stop.sequenceNumber}
                </div>

                <div>
                  <div className="font-semibold text-gray-800">
                    {stop.userId?.name || "Customer"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stop.address.street}, {stop.address.area}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stop.mealDetails?.items?.join(", ")} (
                    {stop.mealDetails?.thaliCount || 1} thali)
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">
                    ETA:{" "}
                    {new Date(stop.estimatedArrival).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${
                      isCompleted
                        ? "bg-green-100 text-green-800"
                        : isCurrent
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {isCompleted
                      ? "Delivered"
                      : isCurrent
                      ? "Current"
                      : "Pending"}
                  </div>
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => setSelectedStop(stop)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>

            {stop.address.phone && (
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {stop.address.phone}
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  const renderCompletionModal = () => {
    if (!selectedStop) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Complete Delivery</h3>
          <p className="text-gray-600 mb-4">
            Mark delivery for {selectedStop.userId?.name} as completed?
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              completeStop(selectedStop._id, {
                notes: formData.get("notes"),
                proofUrl: formData.get("proofUrl"),
              });
            }}
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Notes (Optional)
              </label>
              <textarea
                name="notes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Any special notes about the delivery..."
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proof of Delivery (Optional)
              </label>
              <input
                type="text"
                name="proofUrl"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="URL to delivery proof image"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setSelectedStop(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={completingStop === selectedStop._id}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {completingStop === selectedStop._id
                  ? "Completing..."
                  : "Complete Delivery"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={fetchDriverRoute}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { route, progress } = routeData;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Delivery Route -{" "}
                {shift.charAt(0).toUpperCase() + shift.slice(1)}
              </h1>
              <p className="text-gray-600 mt-1">
                {new Date(date).toLocaleDateString()} • {route.serviceArea} Area
              </p>
            </div>

            {route.routeStatus === "pending" && route.stops.length > 0 && (
              <button
                onClick={startRoute}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Start Route
              </button>
            )}
          </div>

          {/* Progress Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progress.completedStops}
              </div>
              <div className="text-sm text-blue-600">Completed</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progress.totalStops}
              </div>
              <div className="text-sm text-purple-600">Total Stops</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {progress.progressPercentage}%
              </div>
              <div className="text-sm text-green-600">Progress</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-600">
                {progress.estimatedTimeRemaining}m
              </div>
              <div className="text-sm text-orange-600">Time Left</div>
            </div>
          </div>
        </div>

        {/* Route Instructions */}
        {route.routeStatus === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-yellow-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-yellow-800 font-medium">
                You can reorder delivery stops by dragging them. Start your
                route when ready!
              </span>
            </div>
          </div>
        )}

        {/* Delivery Stops */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Delivery Stops ({route.stops.length})
          </h2>

          {route.stops.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m6 0h6"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No deliveries assigned
              </h3>
              <p className="text-gray-600">
                Check back later for delivery assignments.
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="stops">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {route.stops.map((stop, index) =>
                      renderStopCard(stop, index)
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Route Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Route Status
          </h3>
          <div className="flex items-center justify-between">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                route.routeStatus === "completed"
                  ? "bg-green-100 text-green-800"
                  : route.routeStatus === "active"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {route.routeStatus.charAt(0).toUpperCase() +
                route.routeStatus.slice(1)}
            </div>

            {route.startTime && (
              <div className="text-sm text-gray-600">
                Started at:{" "}
                {new Date(route.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {renderCompletionModal()}
    </div>
  );
};

export default DriverRouteManagement;
