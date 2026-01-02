import React from "react";
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const StatusTimeline = ({
  timeline = [],
  currentStage = 0,
  className = "",
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return CheckCircle;
      case "picked-up":
        return Package;
      case "washing":
      case "processing":
        return RefreshCw;
      case "ready":
        return Sparkles;
      case "out-for-delivery":
        return Truck;
      case "delivered":
        return CheckCircle;
      case "cancelled":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (stage, index) => {
    if (stage.completed) {
      return "bg-emerald-500 text-white border-emerald-500";
    }
    if (stage.current || index === currentStage) {
      return "bg-blue-500 text-white border-blue-500";
    }
    if (stage.status === "cancelled") {
      return "bg-red-500 text-white border-red-500";
    }
    return "bg-gray-200 text-gray-400 border-gray-200";
  };

  const getLineColor = (index) => {
    if (index < currentStage || timeline[index]?.completed) {
      return "bg-emerald-500";
    }
    return "bg-gray-200";
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div
        className={`bg-white border border-gray-200 rounded-2xl p-6 ${className}`}
      >
        <div className="text-center text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No tracking information available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Status</h3>
        <p className="text-gray-600">Track your laundry order in real-time</p>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {timeline.map((stage, index) => {
          const IconComponent = getStatusIcon(stage.status);
          const isLast = index === timeline.length - 1;
          const isActive = stage.current || index === currentStage;
          const isCompleted = stage.completed;

          return (
            <div
              key={`${stage.status}-${index}`}
              className="flex items-start gap-4"
            >
              {/* Timeline Icon */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${getStatusColor(
                    stage,
                    index
                  )}`}
                >
                  <IconComponent
                    className={`w-6 h-6 ${
                      isActive && stage.status === "washing"
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`w-1 h-16 mt-2 transition-all duration-300 ${getLineColor(
                      index
                    )}`}
                  />
                )}
              </div>

              {/* Timeline Content */}
              <div className="flex-1 pb-8">
                <div className="flex items-center gap-3 mb-2">
                  <h4
                    className={`text-lg font-semibold transition-colors ${
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                        ? "text-emerald-600"
                        : "text-gray-400"
                    }`}
                  >
                    {stage.title}
                  </h4>

                  {/* Status Badges */}
                  <div className="flex gap-2">
                    {isActive && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                        Current
                      </span>
                    )}
                    {isCompleted && !isActive && (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    )}
                    {stage.urgent && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p
                  className={`mb-3 ${
                    isActive || isCompleted ? "text-gray-700" : "text-gray-500"
                  }`}
                >
                  {stage.description}
                </p>

                {/* Timestamp */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p
                    className={`text-sm ${
                      isCompleted
                        ? "text-gray-700 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {stage.timestamp}
                  </p>
                </div>

                {/* Additional Info */}
                {stage.note && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">{stage.note}</p>
                  </div>
                )}

                {/* Estimated Time for Future Stages */}
                {!isCompleted && stage.estimatedDuration && (
                  <div className="mt-2 text-sm text-gray-500">
                    <span>Estimated duration: {stage.estimatedDuration}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStage + 1) / timeline.length) * 100)}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${((currentStage + 1) / timeline.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Next Step Info */}
      {currentStage < timeline.length - 1 && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900 mb-1">
                Next: {timeline[currentStage + 1]?.title}
              </h4>
              <p className="text-emerald-700 text-sm">
                {timeline[currentStage + 1]?.description}
              </p>
              {timeline[currentStage + 1]?.timestamp !== "Pending" && (
                <p className="text-emerald-600 text-sm mt-1">
                  Expected: {timeline[currentStage + 1]?.timestamp}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusTimeline;
