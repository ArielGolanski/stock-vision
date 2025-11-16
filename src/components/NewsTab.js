// NewsTab.js

import React from 'react';
import { useTheme } from './ThemeContext';
import { ListSkeleton } from './LoadingComponents'; // ייבוא הסקלטון

export default function NewsTab({ news, newsLoading }) {
    const { darkMode } = useTheme();

    if (newsLoading) {
        return <ListSkeleton darkMode={darkMode} count={5} />;
    }

    if (news.length === 0) {
        return <div style={{ color: darkMode ? '#aaa' : '#666', padding: '20px', textAlign: 'center' }}>No news available.</div>;
    }

    return (
        <ul style={{ listStyle: 'none', padding: 0 }}>
            {news.map((article, idx) => (
                <li key={idx} style={{ 
                    padding: '10px', 
                    borderBottom: `1px solid ${darkMode ? '#333' : '#ddd'}`, 
                    marginBottom: '8px',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#333' : '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? '#90caf9' : '#1a0dab', fontWeight: 'bold', textDecoration: 'none' }}>
                        {article.headline}
                    </a>
                    <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>{article.source} — {article.date}</div>
                </li>
            ))}
        </ul>
    );
}