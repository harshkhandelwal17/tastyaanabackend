import React, { useState } from "react";
import { createSchedule } from "../api";

export default function ScheduleEditor({ device }) {
  const [containerIndex, setContainerIndex] = useState(1);
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [label, setLabel] = useState("Morning Pills");
  const [beforeFood, setBeforeFood] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!device) return alert("Select device first");
    setLoading(true);
    try {
      await createSchedule({
        deviceId: device.deviceId,
        containerIndex: Number(containerIndex),
        hour: Number(hour),
        minute: Number(minute),
        label,
        beforeFood,
      });
      alert("Schedule created successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Failed to create schedule ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h3 className="font-semibold mb-2">Add Schedule</h3>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">
          Container
          <select
            value={containerIndex}
            onChange={(e) => setContainerIndex(e.target.value)}
            className="ml-2 p-1 border rounded"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>

        <label className="text-sm">
          Hour
          <input
            type="number"
            min="0"
            max="23"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className="ml-2 p-1 border rounded w-20"
          />
        </label>

        <label className="text-sm">
          Minute
          <input
            type="number"
            min="0"
            max="59"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="ml-2 p-1 border rounded w-20"
          />
        </label>

        <label className="text-sm col-span-2">
          Label
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full p-1 border mt-1 rounded"
          />
        </label>

        <label className="text-sm col-span-2">
          <input
            type="checkbox"
            checked={beforeFood}
            onChange={(e) => setBeforeFood(e.target.checked)}
            className="mr-2"
          />
          Notify before food
        </label>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
