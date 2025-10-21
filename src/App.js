import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Accuracy from "./pages/Accuracy";
import CompetitorPredictions from "./pages/CompetitorPredictions";
import { ThemeProvider } from './components/ThemeContext';
import ChatbotWidget from "./components/ChatbotWidget";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/settings" element={<Settings />} />
          <Route path='/accuracy' element={<Accuracy />} />
          <Route path='/competitor-predictions' element={<CompetitorPredictions />} />
        </Routes>
      </Router>

      {/* Chatbot Widget */}
      <ChatbotWidget />
      
    </ThemeProvider>
  );
}

export default App;
