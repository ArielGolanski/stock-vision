// OverviewTab.js

import React from 'react';
import { useTheme } from './ThemeContext';
import { OverviewSkeleton } from './LoadingComponents'; // ייבוא הסקלטון

export default function OverviewTab({ overview, overviewLoading }) {
    const { darkMode } = useTheme();

    if (overviewLoading) {
        return <OverviewSkeleton darkMode={darkMode} />;
    }

    if (!overview) {
        return <div style={{ color: darkMode ? '#aaa' : '#666', padding: '20px', textAlign: 'center' }}>No overview available.</div>;
    }

    return (
        <div style={{ 
            padding: 20, 
            border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, 
            borderRadius: '8px', 
            background: darkMode ? '#1e1e1e' : '#fff' 
        }}>
            <h3 style={{ margin: '0 0 15px 0', color: darkMode ? '#64b5f6' : '#00bcd4' }}>
                Company Overview
            </h3>
            
            {/* Header: Name and Ticker */}
            <div style={{ marginBottom: 15, borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`, paddingBottom: 10 }}>
                <h4 style={{ margin: 0, fontWeight: 'bold' }}>
                    {overview.name} ({overview.symbol})
                </h4>
            </div>

            {/* Description */}
            <p style={{ lineHeight: '1.6', fontSize: '14px', color: darkMode ? '#ccc' : '#444' }}>
                {overview.description}
            </p>

            {/* Key Financial and Sector Info */}
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '14px' }}>
                
                <div>
                    <strong style={{ color: darkMode ? '#bbb' : '#333' }}>Sector:</strong> {overview.sector}
                </div>
                
                <div>
                    <strong style={{ color: darkMode ? '#bbb' : '#333' }}>Industry:</strong> {overview.industry}
                </div>

                <div>
                    <strong style={{ color: darkMode ? '#bbb' : '#333' }}>Market Cap:</strong> {overview.marketCap}
                </div>
                
                <div>
                    <strong style={{ color: darkMode ? '#bbb' : '#333' }}>Website:</strong> 
                    <a 
                        href={overview.website} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: darkMode ? '#90caf9' : '#2196f3', textDecoration: 'none' }}
                    >
                        Link
                    </a>
                </div>
            </div>
        </div>
    );
}