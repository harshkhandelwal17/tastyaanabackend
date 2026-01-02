import React, { useState } from "react";
import DeviceList from "../components/DeviceList";
import ScheduleEditor from "../components/ScheduleEditor";
import MedicineDashboard from "../components/MedicineDashboard";

function Medicine() {
  const [selectedDevice, setSelectedDevice] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6 text-center text-indigo-700">
        💊 Smart Medicine Box Dashboard
      </h1>
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6">
        <div>
          <DeviceList onSelect={setSelectedDevice} />
          <ScheduleEditor device={selectedDevice} />
        </div>

        <div className="col-span-2">
          <MedicineDashboard device={selectedDevice} />
        </div>
      </div>
    </div>
  );
}

export default Medicine;
