import React, { useEffect, useState } from "react";
import { fetchLogs, fetchSchedulesForDevice, triggerManual } from "../api";

export default function MedicineDashboard({ device }) {
  const [logs, setLogs] = useState([]);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchLogs();
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!device) return;
    (async () => {
      try {
        const res = await fetchSchedulesForDevice(device.deviceId);
        setSchedules(res.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [device]);

  const manualTrigger = async () => {
    if (!device) return alert("Select device first");
    const payload = {
      deviceId: device.deviceId,
      action: "manual_press",
      time: new Date().toISOString(),
    };
    try {
      await triggerManual(payload);
      alert("Manual Trigger Sent ✅");
    } catch (err) {
      console.error(err);
      alert("Trigger Failed ❌");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Dashboard</h2>
        <button
          className="bg-indigo-600 text-white px-3 py-1 rounded"
          onClick={manualTrigger}
        >
          Manual Trigger
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Schedules</h3>
          {schedules.length === 0 ? (
            <p className="text-sm text-gray-500">No schedules</p>
          ) : (
            <ul>
              {schedules.map((s) => (
                <li key={s._id} className="border-b py-2">
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-gray-500">
                    Time: {s.hour}:{s.minute.toString().padStart(2, "0")} | Container {s.containerIndex} |{" "}
                    {s.beforeFood ? "Before food" : "After food"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-2">Logs</h3>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500">No logs</p>
          ) : (
            <ul>
              {logs.map((l) => (
                <li key={l._id} className="border-b py-2 text-sm">
                  <strong>{l.deviceId}</strong> — {l.action} <br />
                  <span className="text-xs text-gray-500">
                    {new Date(l.time).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
