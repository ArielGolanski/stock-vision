import React, { useEffect, useState } from "react";
import { API_URL } from '../config';

function Accuracy() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const resp = await fetch(`${API_URL}/api/accuracy`);
        console.log(resp)
        const json = await resp.json();
        console.log(json)
        if (resp.ok) {
          setMetrics(json);
        }
      } catch (err) {
        console.error("Error loading metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) return <div className="p-6">Loading accuracy data...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Model Accuracy</h1>
      <table className="w-full border border-gray-300 rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Ticker</th>
            <th className="p-2 border">Target</th>
            <th className="p-2 border">MSE</th>
            <th className="p-2 border">RMSE</th>
            <th className="p-2 border">MAE</th>
            <th className="p-2 border">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {
          
          metrics && metrics.map((m, idx) => (
            <tr key={idx} className="text-center">
              <td className="p-2 border font-medium">{m.ticker}</td>
              <td className="p-2 border">{m.target}</td>
              <td className="p-2 border">{m.MSE}</td>
              <td className="p-2 border">{m.RMSE}</td>
              <td className="p-2 border">{m.MAE}</td>
              <td className="p-2 border">{m.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Accuracy;
