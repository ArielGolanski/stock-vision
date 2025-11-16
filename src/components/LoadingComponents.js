// LoadingComponents.js

import React from 'react';

// Enhanced Loading Spinner Component
export function LoadingSpinner({ size = 40, color = '#2196f3' }) {
    return (
        <div style={{
            width: size,
            height: size,
            border: `3px solid rgba(33, 150, 243, 0.1)`,
            borderTop: `3px solid ${color}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
        }} />
    );
}

// Skeleton Loader for Chart
export function ChartSkeleton({ darkMode }) {
    return (
        <div style={{
            height: 500,
            background: darkMode ? '#1e1e1e' : '#f5f5f5',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Shimmer effect */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'}, transparent)`,
                animation: 'shimmer 1.5s infinite'
            }} />
            
            {/* Fake chart bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '4px', paddingTop: '40px' }}>
                {[...Array(20)].map((_, i) => (
                    <div key={i} style={{
                        flex: 1,
                        height: `${Math.random() * 80 + 20}%`,
                        background: darkMode ? '#333' : '#e0e0e0',
                        borderRadius: '2px 2px 0 0',
                    }} />
                ))}
            </div>
        </div>
    );
}

// Skeleton for Technical Info Panel
export function TechnicalInfoSkeleton({ darkMode }) {
    return (
        <div style={{
            marginBottom: 20,
            padding: 16,
            border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
            borderRadius: '8px',
            background: darkMode ? '#1e1e1e' : '#fff',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
                <div style={{
                    width: 48,
                    height: 48,
                    marginRight: 16,
                    borderRadius: '4px',
                    background: darkMode ? '#333' : '#e0e0e0',
                    animation: 'pulse 1.5s ease-in-out infinite'
                }} />
                <div style={{ flex: 1 }}>
                    <div style={{
                        width: '60%',
                        height: 24,
                        background: darkMode ? '#333' : '#e0e0e0',
                        borderRadius: '4px',
                        marginBottom: 8,
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                    <div style={{
                        width: '40%',
                        height: 16,
                        background: darkMode ? '#333' : '#e0e0e0',
                        borderRadius: '4px',
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                </div>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`,
                paddingTop: 10
            }}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{
                            width: '80%',
                            height: 20,
                            margin: '0 auto 8px',
                            background: darkMode ? '#333' : '#e0e0e0',
                            borderRadius: '4px',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            animationDelay: `${i * 0.2}s`
                        }} />
                        <div style={{
                            width: '60%',
                            height: 14,
                            margin: '0 auto',
                            background: darkMode ? '#333' : '#e0e0e0',
                            borderRadius: '4px',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            animationDelay: `${i * 0.2}s`
                        }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Loading state for lists (news, comments, posts, predictions)
export function ListSkeleton({ darkMode, count = 3 }) {
    return (
        <div>
            {[...Array(count)].map((_, i) => (
                <div key={i} style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: darkMode ? '#1e1e1e' : '#fff',
                    border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                    marginBottom: '12px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: '80%',
                        height: 18,
                        background: darkMode ? '#333' : '#e0e0e0',
                        borderRadius: '4px',
                        marginBottom: 10,
                        animation: 'pulse 1.5s ease-in-out infinite',
                        animationDelay: `${i * 0.15}s`
                    }} />
                    <div style={{
                        width: '100%',
                        height: 14,
                        background: darkMode ? '#333' : '#e0e0e0',
                        borderRadius: '4px',
                        marginBottom: 6,
                        animation: 'pulse 1.5s ease-in-out infinite',
                        animationDelay: `${i * 0.15}s`
                    }} />
                    <div style={{
                        width: '60%',
                        height: 14,
                        background: darkMode ? '#333' : '#e0e0e0',
                        borderRadius: '4px',
                        animation: 'pulse 1.5s ease-in-out infinite',
                        animationDelay: `${i * 0.15}s`
                    }} />
                </div>
            ))}
        </div>
    );
}

// Skeleton for HypeMeter
export function HypeMeterSkeleton({ darkMode }) {
    return (
        <div style={{
            padding: '16px',
            borderRadius: '8px',
            background: darkMode ? '#1e1e1e' : '#fff',
            border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                    width: '50%',
                    height: 24,
                    margin: '0 auto 10px',
                    background: darkMode ? '#333' : '#e0e0e0',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite'
                }} />
                <div style={{
                    width: '120px',
                    height: 60,
                    margin: '10px auto',
                    background: darkMode ? '#333' : '#e0e0e0',
                    borderRadius: '8px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: '0.1s'
                }} />
                <div style={{
                    width: '70%',
                    height: 14,
                    margin: '0 auto',
                    background: darkMode ? '#333' : '#e0e0e0',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: '0.2s'
                }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '60px',
                            height: 20,
                            margin: '0 auto 8px',
                            background: darkMode ? '#333' : '#e0e0e0',
                            borderRadius: '4px',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            animationDelay: `${i * 0.3}s`
                        }} />
                        <div style={{
                            width: '50px',
                            height: 14,
                            margin: '0 auto',
                            background: darkMode ? '#333' : '#e0e0e0',
                            borderRadius: '4px',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            animationDelay: `${i * 0.3}s`
                        }} />
                    </div>
                ))}
            </div>
            <h4 style={{ borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, paddingTop: '16px', marginBottom: '10px' }}>Top Posts</h4>
            <ListSkeleton darkMode={darkMode} count={3} />
        </div>
    );
}

// Skeleton for Overview
export function OverviewSkeleton({ darkMode }) {
    return (
        <div style={{ 
            padding: 20, 
            border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, 
            borderRadius: '8px', 
            background: darkMode ? '#1e1e1e' : '#fff',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ 
                width: '50%', 
                height: 24, 
                background: darkMode ? '#333' : '#e0e0e0', 
                borderRadius: '4px', 
                marginBottom: 15, 
                animation: 'pulse 1.5s ease-in-out infinite' 
            }} />
            
            <div style={{ marginBottom: 15, borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`, paddingBottom: 10 }}>
                <div style={{ 
                    width: '70%', 
                    height: 20, 
                    background: darkMode ? '#333' : '#e0e0e0', 
                    borderRadius: '4px', 
                    margin: '0 0 5px 0', 
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: '0.1s'
                }} />
            </div>

            {[...Array(4)].map((_, i) => (
                <div key={i} style={{ 
                    width: `${90 - i * 10}%`, 
                    height: 14, 
                    background: darkMode ? '#333' : '#e0e0e0', 
                    borderRadius: '4px', 
                    marginBottom: 8,
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: `${0.2 + i * 0.1}s`
                }} />
            ))}

            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '14px' }}>
                {[...Array(4)].map((_, i) => (
                    <div key={i}>
                        <div style={{ 
                            width: '80%', 
                            height: 16, 
                            background: darkMode ? '#333' : '#e0e0e0', 
                            borderRadius: '4px',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            animationDelay: `${0.6 + i * 0.1}s`
                        }} />
                    </div>
                ))}
            </div>
        </div>
    );
}