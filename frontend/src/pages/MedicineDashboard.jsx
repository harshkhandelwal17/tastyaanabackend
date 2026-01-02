// MedicineDashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";

export default function MedicineDashboard() {
  const [logs,setLogs] = useState([]);

  useEffect(()=>{
    fetchLogs();
    const interval = setInterval(fetchLogs,5000); // auto refresh every 5s
    return ()=> clearInterval(interval);
  },[]);

  const fetchLogs = async ()=>{
    try{
      const res = await axios.get("http://localhost:5000/api/medicine");
      setLogs(res.data);
    }catch(err){
      console.error(err);
    }
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Smart Medicine Box Logs</h1>
      <div className="bg-white shadow rounded-lg p-4">
        {logs.length===0 ? <p>No data yet</p> :
          <table className="table-auto w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Device</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log)=>(
                <tr key={log._id} className="border-b">
                  <td className="px-4 py-2">{log.time}</td>
                  <td className="px-4 py-2">{log.deviceId}</td>
                  <td className="px-4 py-2">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}
