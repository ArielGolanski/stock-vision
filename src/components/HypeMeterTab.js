// HypeMeterTab.js

import React from 'react';
import { useTheme } from './ThemeContext';
import { HypeMeterSkeleton } from './LoadingComponents'; // ייבוא הסקלטון

export default function HypeMeterTab({ hypeData, hypeLoading, hypeTimeframe, setHypeTimeframe }) {
    const { darkMode } = useTheme();

    const hypeTimeframes = [
        { label: 'Past Day', value: 'day' },
        { label: 'Past Week', value: 'week' },
        { label: 'Past Month', value: 'month' },
    ];

    if (hypeLoading) {
        return <HypeMeterSkeleton darkMode={darkMode} />;
    }

    if (!hypeData) {
        return <div style={{ color: darkMode ? '#aaa' : '#666', padding: '20px', textAlign: 'center' }}>Failed to load hype data.</div>;
    }

    return (
        <div>
            <h3 style={{ marginBottom: '16px' }}>HypeMeter</h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {hypeTimeframes.map((tf) => (
                    <button 
                        key={tf.value} 
                        onClick={() => setHypeTimeframe(tf.value)} 
                        style={{ 
                            padding: '6px 12px', 
                            borderRadius: '6px', 
                            border: hypeTimeframe === tf.value ? '2px solid #2196f3' : `1px solid ${darkMode ? '#555' : '#ccc'}`, 
                            background: hypeTimeframe === tf.value ? '#2196f3' : 'transparent', 
                            color: hypeTimeframe === tf.value ? '#fff' : darkMode ? '#f1f1f1' : '#111', 
                            cursor: 'pointer' 
                        }}
                    >
                        {tf.label}
                    </button>
                ))}
            </div>

            <div style={{ padding: '16px', borderRadius: '8px', background: darkMode ? '#1e1e1e' : '#fff', border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}` }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: hypeData.hypeLevel.color }}>
                        {hypeData.hypeLevel.label}
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: 'extrabold', color: hypeData.hypeLevel.color, margin: '10px 0' }}>
                        {hypeData.hypeScore}%
                    </div>
                    <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>
                        Hype Score for the {hypeData.timeframe} (Reddit)
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{hypeData.mentions}</div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>Mentions</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>{hypeData.sentiment.positive.toFixed(1)}%</div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>Positive</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>{hypeData.sentiment.negative.toFixed(1)}%</div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>Negative</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{hypeData.sentiment.averageScore.toFixed(2)}</div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>Avg. Sentiment</div>
                    </div>
                </div>

                <h4 style={{ borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, paddingTop: '16px', marginBottom: '10px' }}>Top Posts</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {hypeData.topPosts.map((post, idx) => (
                        <li key={idx} style={{ marginBottom: '10px', borderBottom: `1px dotted ${darkMode ? '#222' : '#f0f0f0'}`, paddingBottom: '8px' }}>
                            <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? '#90caf9' : '#1a0dab', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                                {post.title}
                            </a>
                            <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666', marginTop: '4px' }}>
                                <span style={{ color: post.sentiment === 'positive' ? '#059669' : post.sentiment === 'negative' ? '#dc2626' : '#ffaa00', fontWeight: 'bold' }}>
                                    {post.sentiment.toUpperCase()}
                                </span>
                                {' | '}
                                r/{post.subreddit}
                                {' | '}
                                Score: {post.score}
                                {' | '}
                                Comments: {post.numComments}
                            </div>
                        </li>
                    ))}
                </ul>

                <div style={{ fontSize: '10px', color: darkMode ? '#555' : '#999', marginTop: '16px', textAlign: 'right' }}>
                    Data last updated: {new Date(hypeData.lastUpdated).toLocaleString()}
                </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', borderRadius: '8px', background: darkMode ? '#282828' : '#e0f7fa', border: `1px solid ${darkMode ? '#444' : '#b2ebf2'}`, marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#64b5f6' : '#00bcd4' }}>
                    💡 How the Hype Score is Calculated
                </h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', lineHeight: '1.4', color: darkMode ? '#ccc' : '#444' }}>
                    The Hype Score (0-100%) is calculated by aggregating data from top finance subreddits ({hypeData.timeframe} timeframe) based on four weighted factors:
                </p>
                <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', color: darkMode ? '#ccc' : '#444' }}>
                    <li>Mention Score (Max 30%): Based on the sheer volume of posts mentioning the ticker.</li>
                    <li>Sentiment Score (Max 40%): Calculated from the net positive vs. negative sentiment of all analyzed posts.</li>
                    <li>Engagement Score (Max 20%): Measures the average upvotes and comments on the top posts, indicating user interaction.</li>
                    <li>Trend Score (Max 10%): Weighs posts from the last 6 hours more heavily to capture recent activity.</li>
                </ul>
                <h5 style={{ margin: '15px 0 5px 0', color: darkMode ? '#90caf9' : '#0097a7', fontSize: '13px' }}>
                    Details: Individual Post Sentiment Score
                </h5>
                <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '12px', color: darkMode ? '#bbb' : '#555' }}>
                    <li>Lexicon: Sentiment is determined using the AFINN-165 wordlist (over 3,300 emotional words).</li>
                    <li>Word Scoring: Each recognized word is assigned a fixed score from -5 (negative) to +5 (positive).</li>
                    <li>Calculation: The post's total `sentimentScore` is the sum of all scores of the emotional words found in its title and body.</li>
                </ul>
            </div>
        </div>
    );
}