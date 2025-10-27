import React, { useState, useEffect } from "react";
import { useTheme } from '../components/ThemeContext';
import HeaderMenu from '../components/HeaderMenu';
import { API_URL } from '../config';

// Helper function to get change color
const getChangeColor = (change, darkMode) => {
  if (change > 0) return darkMode ? 'text-green-400' : 'text-green-600';
  if (change < 0) return darkMode ? 'text-red-400' : 'text-red-600';
  return darkMode ? 'text-gray-400' : 'text-gray-600';
};

// Helper function to get rating color
const getRatingColor = (rating) => {
  switch (rating.toLowerCase()) {
    case 'strong buy':
      return 'text-green-600 bg-green-100';
    case 'buy':
      return 'text-green-500 bg-green-50';
    case 'hold':
      return 'text-yellow-600 bg-yellow-100';
    case 'sell':
      return 'text-red-500 bg-red-50';
    case 'strong sell':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Prediction Card Component
const PredictionCard = ({ title, data, darkMode, isOurModel = false }) => {
  const changeColor = getChangeColor(data.change, darkMode);
  const directionIcon = data.change > 0 ? '↗' : data.change < 0 ? '↘' : '→';
  
  return (
    <div className={`p-6 rounded-lg shadow border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        {isOurModel && (
          <span className="px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full">
            Our Model
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Predicted Price</span>
          <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            ${data.price.toFixed(2)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Change</span>
          <div className="flex items-center space-x-1">
            <span className="text-lg">{directionIcon}</span>
            <span className={`text-lg font-semibold ${changeColor}`}>
              {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
            </span>
          </div>
        </div>
        
        {data.rating && (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rating</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRatingColor(data.rating)}`}>
              {data.rating}
            </span>
          </div>
        )}
        
        {data.outlook && (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Outlook</span>
            <span className={`text-sm font-medium ${changeColor}`}>
              {data.outlook}
            </span>
          </div>
        )}
        
        {data.confidence && (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Confidence</span>
            <div className="flex items-center space-x-2">
              <div className={`w-16 h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-2 rounded-full bg-indigo-500" 
                  style={{ width: `${data.confidence}%` }}
                ></div>
              </div>
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {data.confidence}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function CompetitorPredictions() {
  const { darkMode } = useTheme();
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [selectedType, setSelectedType] = useState('daily');
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tickers = ['AAPL', 'MSFT', 'IBM', 'T'];
  const types = ['daily', 'monthly'];

  // Fetch competitor predictions when ticker or type changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_URL}/api/competitor-predictions?ticker=${selectedTicker}&type=${selectedType}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch predictions');
        }
        
        const data = await response.json();
        setCurrentData({
          ourModel: data.ourModel,
          wallStreetZen: data.wallStreetZen,
          yahooFinance: data.yahooFinance
        });
      } catch (err) {
        setError(err.message);
        console.error('Error fetching competitor predictions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTicker, selectedType]);

  return (
    <div className={`p-6 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <HeaderMenu />
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Competitor Predictions
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Compare our AI model predictions with industry leaders
          </p>
        </div>

        {/* Filter Controls */}
        <div className={`mb-6 rounded-lg shadow border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ticker" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Stock Ticker
              </label>
              <select
                id="ticker"
                name="ticker"
                className={`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm ${
                  darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900'
                }`}
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
              >
                {tickers.map(ticker => (
                  <option key={ticker} value={ticker}>{ticker}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="type" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Prediction Type
              </label>
              <select
                id="type"
                name="type"
                className={`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm ${
                  darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900'
                }`}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {types.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className={`px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                <span className="text-sm">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="mt-2">Loading predictions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
            <p className={`${darkMode ? 'text-red-200' : 'text-red-800'}`}>
              Error loading predictions: {error}
            </p>
          </div>
        )}

        {/* Prediction Cards - only show if not loading and has data */}
        {!loading && currentData && !error && (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <PredictionCard 
            title="Our AI Model" 
            data={currentData.ourModel} 
            darkMode={darkMode} 
            isOurModel={true}
          />
          <PredictionCard 
            title="WallStreetZen" 
            data={currentData.wallStreetZen} 
            darkMode={darkMode}
          />
          <PredictionCard 
            title="Yahoo Finance" 
            data={currentData.yahooFinance} 
            darkMode={darkMode}
          />
        </div>

        {/* Comparison Table */}
        <div className={`rounded-lg shadow border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Detailed Comparison
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Metric
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Our Model
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    WallStreetZen
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Yahoo Finance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Predicted Price
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${currentData.ourModel.price.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${currentData.wallStreetZen.price.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${currentData.yahooFinance.price.toFixed(2)}
                  </td>
                </tr>
                <tr className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Price Change
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getChangeColor(currentData.ourModel.change, darkMode)}`}>
                    {currentData.ourModel.change > 0 ? '+' : ''}{currentData.ourModel.change.toFixed(1)}%
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getChangeColor(currentData.wallStreetZen.change, darkMode)}`}>
                    {currentData.wallStreetZen.change > 0 ? '+' : ''}{currentData.wallStreetZen.change.toFixed(1)}%
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getChangeColor(currentData.yahooFinance.change, darkMode)}`}>
                    {currentData.yahooFinance.change > 0 ? '+' : ''}{currentData.yahooFinance.change.toFixed(1)}%
                  </td>
                </tr>
                <tr className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Recommendation
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI Generated
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentData.wallStreetZen.rating}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentData.yahooFinance.outlook}
                  </td>
                </tr>
                <tr className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Confidence Level
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    N/A
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentData.wallStreetZen.confidence}%
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentData.yahooFinance.confidence}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer */}
        <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-400'}`} viewBox="0 0 20 20" fill="currentColor" width={20} height={20}>
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                Disclaimer
              </h3>
              <div className={`mt-2 text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                <p>
                  This comparison shows mock data for demonstration purposes. 
                  WallStreetZen and Yahoo Finance predictions are simulated and not real-time data. 
                  Always conduct your own research before making investment decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CompetitorPredictions;
