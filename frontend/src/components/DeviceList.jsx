import React, { useEffect, useState } from "react";
import { fetchDevices } from "../api";

export default function DeviceList({ onSelect }) {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchDevices();
        setDevices(res.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Devices</h2>
      {devices.length === 0 ? (
        <p className="text-sm text-gray-500">No devices found</p>
      ) : (
        <ul>
          {devices.map((d) => (
            <li
              key={d.deviceId}
              className="flex items-center justify-between py-2 border-b"
            >
              <div>
                <div className="font-medium">{d.name || d.deviceId}</div>
                <div className="text-xs text-gray-500">
                  Last seen: {new Date(d.lastSeen).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => onSelect(d)}
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
