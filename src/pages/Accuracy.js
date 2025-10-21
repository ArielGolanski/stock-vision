import React, { useEffect, useState } from "react";
import { API_URL } from '../config';
import HeaderMenu from '../components/HeaderMenu';

// --- Icon Components (for a cleaner look) ---

const TickerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width={24} height={24}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const TypeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width={24} height={24}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const GradeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width={24} height={24}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const MAEIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width={24} height={24}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 0.5C5.196 0.5 0.5 5.196 0.5 11S5.196 21.5 11 21.5 21.5 16.804 21.5 11 16.804 0.5 11 0.5z M11 16C8.239 16 6 13.761 6 11S8.239 6 11 6 16 8.239 16 11 13.761 16 11 16z" transform="translate(1 1)" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 12.5C9.619 12.5 8.5 11.381 8.5 10S9.619 7.5 11 7.5 13.5 8.619 13.5 10 12.381 12.5 11 12.5z" transform="translate(1 1)" />
  </svg>
);

const RMSEIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width={24} height={24}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 0120 12c0 2.304-.863 4.41-2.278 6.01M11 3.055A9.001 9.001 0 002 12c0 4.97 4.03 9 9 9 2.304 0 4.41-.863 6.01-2.278M11 3.055V12H2.278" />
  </svg>
);


// --- Helper Function for Grading (Using MAE) ---
// These thresholds assume MAE is an absolute percentage point error (e.g., 0.5 = 0.5%).
const getAccuracyGrade = (mae) => {
  if (mae < 0.5) {
    return {
      grade: 'A+',
      description: 'Excellent. Average error is < 0.5 percentage points.',
      color: 'text-green-500',
      borderColor: 'border-green-500',
    };
  }
  if (mae < 1.0) {
    return {
      grade: 'A',
      description: 'Great. Average error is < 1.0 percentage points.',
      color: 'text-green-400',
      borderColor: 'border-green-400',
    };
  }
  if (mae < 1.5) {
    return {
      grade: 'B',
      description: 'Good. Average error is < 1.5 percentage points.',
      color: 'text-yellow-500',
      borderColor: 'border-yellow-500',
    };
  }
  if (mae < 2.5) {
    return {
      grade: 'C',
      description: 'Fair. Average error is < 2.5 percentage points.',
      color: 'text-orange-500',
      borderColor: 'border-orange-500',
    };
  }
  return {
    grade: 'D',
    description: 'Poor. Average error is > 2.5 percentage points.',
    color: 'text-red-500',
    borderColor: 'border-red-500',
  };
};

// --- Main Component ---
function Accuracy() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [selectedType, setSelectedType] = useState('daily');

  const tickers = ['AAPL', 'MSFT', 'IBM', 'T'];
  const types = ['daily', 'monthly'];

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      setMetrics([]);

      try {
        const url = new URL(`${API_URL}/api/accuracy`);
        url.searchParams.append('ticker', selectedTicker);
        url.searchParams.append('type', selectedType);
        
        const resp = await fetch(url.toString());
        
        if (!resp.ok) {
          throw new Error(`Failed to fetch data: ${resp.status} ${resp.statusText}`);
        }
        
        const json = await resp.json();
        setMetrics(json);

      } catch (err) {
        console.error("Error loading metrics:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMetrics();
  }, [selectedTicker, selectedType]);

  // Helper function to render the main content
  const renderMetrics = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-md">
          <h3 className="text-lg font-semibold text-red-800">An Error Occurred</h3>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      );
    }
    
    if (metrics.length === 0) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-md">
          <h3 className="text-lg font-semibold text-yellow-800">No Data</h3>
          <p className="text-yellow-700 mt-1">No accuracy data found for the selected ticker and type.</p>
        </div>
      );
    }

    // Get the most recent metric entry (assuming API returns newest first)
    const latestMetric = metrics[0];
    const gradeInfo = getAccuracyGrade(latestMetric.MAE); // Grading based on MAE

    return (
      <div className="mt-6">
        {/* --- Key Metric Cards --- */}
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Latest Performance Grade</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Base Card Style */}
          {/* `transition-all duration-300 hover:shadow-xl hover:-translate-y-1` */}

          {/* Grade Card (Special) */}
          <div className={`bg-white p-5 rounded-lg shadow-lg border-b-4 ${gradeInfo.borderColor} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Accuracy Grade</h3>
              <span className={gradeInfo.color}><GradeIcon /></span>
            </div>
            <p className={`text-5xl font-bold mt-2 ${gradeInfo.color}`}>{gradeInfo.grade}</p>
            <p className="text-sm text-gray-600 mt-2">{gradeInfo.description}</p>
          </div>

          {/* MAE Card */}
          <div className="bg-white p-5 rounded-lg shadow-lg border-b-4 border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Mean Absolute Error (MAE)</h3>
              <span className="text-gray-400"><MAEIcon /></span>
            </div>
            <p className="text-4xl font-bold mt-2 text-gray-800">{latestMetric.MAE.toFixed(4)}</p>
            <p className="text-sm text-gray-600 mt-2">Average error in percentage points (e.g., 0.5 = 0.5%).</p>
          </div>
          
          {/* RMSE Card */}
          <div className="bg-white p-5 rounded-lg shadow-lg border-b-4 border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Root Mean Squared Error</h3>
              <span className="text-gray-400"><RMSEIcon /></span>
            </div>
            <p className="text-4xl font-bold mt-2 text-gray-800">{latestMetric.RMSE.toFixed(4)}</p>
             <p className="text-sm text-gray-600 mt-2">Penalizes large errors more heavily.</p>
          </div>
          
          {/* MAPE Card (Displaying it, but not using for grading) */}
          {/* <div className="bg-white p-5 rounded-lg shadow-lg border-b-4 border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Mean Absolute % Error (MAPE)</h3>
              <span className="text-gray-400"><MSEIcon /></span>
            </div>
            <p className="text-4xl font-bold mt-2 text-gray-800">{latestMetric.MAPE.toFixed(2)} %</p>
            <p className="text-sm text-gray-600 mt-2">(Note: Can be misleading for % change models).</p>
          </div> */}
        </div>

        {/* --- Historical Data Table --- */}
        <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-10">Historical Performance Log</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">MAE</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">RMSE</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">MAPE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.map((m, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 whitespace-nowrap text-sm text-gray-600">{new Date(m.timestamp).toLocaleString()}</td>
                  <td className="p-3 whitespace-nowrap text-sm text-gray-800 font-medium">{m.target}</td>
                  <td className="p-3 whitespace-nowrap text-sm text-gray-600">{m.MAE.toFixed(4)}</td>
                  <td className="p-3 whitespace-nowrap text-sm text-gray-600">{m.RMSE.toFixed(4)}</td>
                  <td className="p-3 whitespace-nowrap text-sm text-gray-600">{m.MAPE.toFixed(2)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 bg-gray-100 min-h-screen">
      <HeaderMenu />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Model Accuracy</h1>
        <p className="text-lg text-gray-600 mb-6">Review the performance of the prediction models.</p>
        
        {/* --- Filter Controls --- */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ticker Select */}
            <div>
              <label htmlFor="ticker" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <TickerIcon />
                Stock Ticker
              </label>
              <select
                id="ticker"
                name="ticker"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
              >
                {tickers.map(ticker => (
                  <option key={ticker} value={ticker}>{ticker}</option>
                ))}
              </select>
            </div>
            
            {/* Type Select */}
            <div>
              <label htmlFor="type" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <TypeIcon />
                Prediction Type
              </label>
              <select
                id="type"
                name="type"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {types.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* --- Metrics Display --- */}
        {renderMetrics()}
      </div>
    </div>
  );
}

export default Accuracy;