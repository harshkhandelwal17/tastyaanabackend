import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, Clock, AlertTriangle, X } from "lucide-react";

const PerformanceMonitor = ({ isVisible = false, onToggle }) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    renderTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    slowActions: [],
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Performance monitoring
  useEffect(() => {
    if (!isVisible) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics((prev) => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    // Start FPS monitoring
    animationId = requestAnimationFrame(measureFPS);

    // Memory monitoring
    const memoryInterval = setInterval(() => {
      if (performance.memory) {
        const memoryUsage = Math.round(
          performance.memory.usedJSHeapSize / 1024 / 1024
        );
        setMetrics((prev) => ({ ...prev, memory: memoryUsage }));
      }
    }, 1000);

    // API call monitoring
    const originalFetch = window.fetch;
    let apiCallCount = 0;
    let cacheHitCount = 0;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      apiCallCount++;

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Check if it's a cache hit (fast response)
        if (duration < 50) {
          cacheHitCount++;
        }

        // Track slow API calls
        if (duration > 1000) {
          setMetrics((prev) => ({
            ...prev,
            slowActions: [
              ...prev.slowActions.slice(-4), // Keep only last 5
              {
                type: "API Call",
                duration: Math.round(duration),
                url: args[0],
                timestamp: new Date().toISOString(),
              },
            ],
          }));
        }

        setMetrics((prev) => ({
          ...prev,
          apiCalls: apiCallCount,
          cacheHits: cacheHitCount,
          renderTime: Math.round(duration),
        }));

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        setMetrics((prev) => ({
          ...prev,
          slowActions: [
            ...prev.slowActions.slice(-4),
            {
              type: "API Error",
              duration: Math.round(duration),
              url: args[0],
              timestamp: new Date().toISOString(),
            },
          ],
        }));

        throw error;
      }
    };

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      clearInterval(memoryInterval);
      window.fetch = originalFetch;
    };
  }, [isVisible]);

  // Monitor Redux actions
  useEffect(() => {
    if (!isVisible) return;

    const checkSlowActions = () => {
      if (window.actionPerformance) {
        const slowActions = Object.entries(window.actionPerformance)
          .filter(([_, perf]) => perf.avgTime > 16)
          .map(([action, perf]) => ({
            type: action,
            duration: Math.round(perf.avgTime),
            count: perf.count,
            timestamp: new Date().toISOString(),
          }))
          .slice(-5);

        setMetrics((prev) => ({ ...prev, slowActions }));
      }
    };

    const actionInterval = setInterval(checkSlowActions, 2000);
    return () => clearInterval(actionInterval);
  }, [isVisible]);

  const getPerformanceColor = useCallback((value, thresholds) => {
    if (value <= thresholds.good) return "text-green-500";
    if (value <= thresholds.warning) return "text-yellow-500";
    return "text-red-500";
  }, []);

  const getPerformanceIcon = useCallback((value, thresholds) => {
    if (value <= thresholds.good) return <Zap className="w-4 h-4" />;
    if (value <= thresholds.warning) return <Clock className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span className="font-semibold text-sm">Performance Monitor</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                {isExpanded ? "−" : "+"}
              </button>
              <button
                onClick={onToggle}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="p-4 space-y-3">
            {/* FPS */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">FPS:</span>
              <div className="flex items-center space-x-1">
                {getPerformanceIcon(metrics.fps, { good: 50, warning: 30 })}
                <span
                  className={`font-mono text-sm ${getPerformanceColor(
                    metrics.fps,
                    { good: 50, warning: 30 }
                  )}`}
                >
                  {metrics.fps}
                </span>
              </div>
            </div>

            {/* Memory */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Memory:</span>
              <div className="flex items-center space-x-1">
                {getPerformanceIcon(metrics.memory, {
                  good: 100,
                  warning: 200,
                })}
                <span
                  className={`font-mono text-sm ${getPerformanceColor(
                    metrics.memory,
                    { good: 100, warning: 200 }
                  )}`}
                >
                  {metrics.memory}MB
                </span>
              </div>
            </div>

            {/* API Calls */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Calls:</span>
              <span className="font-mono text-sm text-blue-600">
                {metrics.apiCalls}
              </span>
            </div>

            {/* Cache Hits */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cache Hits:</span>
              <span className="font-mono text-sm text-green-600">
                {metrics.cacheHits}
              </span>
            </div>

            {/* Render Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Render:</span>
              <div className="flex items-center space-x-1">
                {getPerformanceIcon(metrics.renderTime, {
                  good: 16,
                  warning: 50,
                })}
                <span
                  className={`font-mono text-sm ${getPerformanceColor(
                    metrics.renderTime,
                    { good: 16, warning: 50 }
                  )}`}
                >
                  {metrics.renderTime}ms
                </span>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200"
              >
                <div className="p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-gray-800">
                    Slow Actions
                  </h4>
                  {metrics.slowActions.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {metrics.slowActions.map((action, index) => (
                        <div
                          key={index}
                          className="text-xs bg-red-50 p-2 rounded"
                        >
                          <div className="font-medium text-red-800">
                            {action.type}
                          </div>
                          <div className="text-red-600">
                            {action.duration}ms
                          </div>
                          {action.url && (
                            <div className="text-red-500 truncate">
                              {action.url}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      No slow actions detected
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PerformanceMonitor;
