// RiskCalculatorTab.js
import React, { useMemo } from 'react';
import { LoadingSpinner } from './LoadingComponents'; 
import { useTheme } from './ThemeContext';


export default function ProfitCalculatorTab({
    technicalInfo,
    predictions,
    investmentAmount,
    setInvestmentAmount,
    loading,
    feesLoading,
    userFees,
    ticker
}) {
    const { darkMode } = useTheme();

    const riskCalculation = useMemo(() => {
        if (!technicalInfo || !predictions.length || !investmentAmount || loading || feesLoading) return null;
        
        const currentPrice = technicalInfo.last_close; 
        if (!currentPrice || currentPrice <= 0) return { error: "Current stock price not available." };
        
        const fiveDayPredictions = predictions.slice(0, 5); 
        
        if (fiveDayPredictions.length === 0) return { error: "5-day prediction data not available." };

        const sharesToBuy = Math.floor(investmentAmount / currentPrice);
        
        if (sharesToBuy === 0) return { error: "Amount too small to buy even one share." };
        
        const buyFee = Math.max(userFees.feePerShare * sharesToBuy, userFees.feeMinimum); 
        const sellFeeBase = Math.max(userFees.feePerShare * sharesToBuy, userFees.feeMinimum);
        const totalBaseFees = buyFee + sellFeeBase; 
        const TAX_RATE = 0.25;

        const results = fiveDayPredictions.map(p => {
            const futurePrediction = p.predicted_close;
            
            const grossProfitPerShare = futurePrediction - currentPrice;
            const grossProfitTotal = sharesToBuy * grossProfitPerShare;
            
            const taxableProfit = grossProfitTotal > 0 ? grossProfitTotal : 0;
            const taxAmount = taxableProfit * TAX_RATE; 
            
            const netProfit = grossProfitTotal - totalBaseFees - taxAmount;

            return {
                date: p.date,
                predictedClose: futurePrediction,
                grossProfitTotal: grossProfitTotal,
                totalFees: totalBaseFees,
                taxAmount: taxAmount,
                netProfit: netProfit,
            };
        });

        const maxProfitResult = results.reduce((max, current) => 
            current.netProfit > max.netProfit ? current : max, results[0]
        );
        
        // *************************************************************
        // START: NEW RISK SCORE CALCULATION
        // *************************************************************
        const totalNetProfit = results.reduce((sum, r) => sum + r.netProfit, 0);
        const avgNetProfit = totalNetProfit / results.length;
        const maxNetProfit = maxProfitResult.netProfit;

        let riskScore = 0;
        let riskLevel = 'N/A';

        if (maxNetProfit <= 0) {
            riskScore = 0; // Highest Risk / Avoid
            riskLevel = 'AVOID (Max Loss)';
        } else {
            // Calculate consistency score: Avg/Max normalized to 100
            // Ensures score is between 0 and 100
            riskScore = Math.max(0, Math.min(100, (avgNetProfit / maxNetProfit) * 100));

            if (riskScore >= 75) {
                riskLevel = 'LOW RISK';
            } else if (riskScore >= 40) {
                riskLevel = 'MEDIUM RISK';
            } else {
                riskLevel = 'HIGH RISK';
            }
        }
        
        // *************************************************************
        // END: NEW RISK SCORE CALCULATION
        // *************************************************************


        return {
            currentPrice,
            sharesToBuy,
            ticker,
            maxProfitResult,
            results,
            avgNetProfit,
            riskScore: riskScore.toFixed(0),
            riskLevel: riskLevel,
            error: null,
        };
    }, [technicalInfo, predictions, investmentAmount, loading, feesLoading, userFees, ticker]);
    
    
    // Helper function for Risk Level color
    const getRiskColor = (level) => {
        switch (level) {
            case 'LOW RISK': return '#059669';
            case 'MEDIUM RISK': return '#fbbf24';
            case 'HIGH RISK': return '#dc2626';
            case 'AVOID (Max Loss)': return '#7f1d1d'; // Dark red for AVOID
            default: return darkMode ? '#aaa' : '#666';
        }
    };
    
    return (
        <div style={{ padding: '20px', borderRadius: '8px', background: darkMode ? '#1e1e1e' : '#fff', border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}` }}>
            <h3 style={{ margin: '0 0 15px 0', color: darkMode ? '#64b5f6' : '#00bcd4' }}>
                Profit Calculator: Net Profit Forecast (Next 5 Days)
            </h3>

            {(feesLoading || loading) ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <LoadingSpinner size={32} color={darkMode ? '#64b5f6' : '#2196f3'}/>
                    <p style={{ marginTop: '10px', color: darkMode ? '#aaa' : '#666' }}>
                        Loading user fees and stock predictions...
                    </p>
                </div>
            ) : (
                <>
                    {/* NEW: RISK SCORE DISPLAY */}
                    {riskCalculation?.riskScore !== undefined && (
                        <div style={{ 
                            marginBottom: '20px', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            border: `2px solid ${getRiskColor(riskCalculation.riskLevel)}`,
                            backgroundColor: darkMode ? '#333' : '#f0f0f0',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666', marginBottom: '5px' }}>
                                Profit Consistency Score (0-100)
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                                <strong style={{ fontSize: '30px', color: getRiskColor(riskCalculation.riskLevel) }}>
                                    {riskCalculation.riskScore}
                                </strong>
                                <span style={{ 
                                    fontSize: '18px', 
                                    fontWeight: 'bold', 
                                    color: getRiskColor(riskCalculation.riskLevel)
                                }}>
                                    — {riskCalculation.riskLevel}
                                </span>
                            </div>
                            <div style={{ fontSize: '11px', color: darkMode ? '#bbb' : '#444', marginTop: '5px' }}>
                                Avg. Net Profit: ${riskCalculation.avgNetProfit.toFixed(2)}
                            </div>
                        </div>
                    )}
                    {/* END NEW: RISK SCORE DISPLAY */}

                    <div style={{ marginBottom: '20px', borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`, paddingBottom: '15px' }}>
                        <div style={{ marginBottom: '15px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <label style={{ fontWeight: 'bold' }}>
                                Investment Amount (USD):
                            </label>
                            <input
                                type="number"
                                step="100"
                                value={investmentAmount}
                                onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
                                style={{ 
                                    padding: '8px', 
                                    borderRadius: '4px', 
                                    border: `1px solid ${darkMode ? '#555' : '#ccc'}`, 
                                    width: '150px',
                                    background: darkMode ? '#333' : '#fff',
                                    color: darkMode ? '#f1f1f1' : '#111'
                                }}
                            />
                        </div>

                        <p style={{ fontSize: '13px', color: darkMode ? '#aaa' : '#666' }}>
                            Your Fees (from Settings): Fee Per Share: ${userFees.feePerShare.toFixed(4)}, Minimum Fee: ${userFees.feeMinimum.toFixed(2)}
                        </p>
                        <p style={{ fontSize: '13px', color: '#dc2626' }}>
                            Tax Rate Applied: 25% on gross profit.
                        </p>
                        
                        {riskCalculation?.currentPrice && (
                            <p style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '10px', color: darkMode ? '#f1f1f1' : '#111' }}>
                                Purchase Price: ${riskCalculation.currentPrice.toFixed(2)} | Shares Purchased: {riskCalculation.sharesToBuy}
                            </p>
                        )}
                    </div>
                </>
            )}


            {riskCalculation?.error && (
                <div style={{ color: '#dc2626', fontWeight: 'bold', padding: '10px', border: '1px solid #dc2626', borderRadius: '4px' }}>
                    {riskCalculation.error}
                </div>
            )}
            
            {riskCalculation && riskCalculation.results?.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h4 style={{ color: darkMode ? '#f1f1f1' : '#111', borderBottom: `1px dotted ${darkMode ? '#333' : '#eee'}`, paddingBottom: '10px' }}>
                        📅 Daily Net Profit Forecast (Next 5 Days)
                    </h4>
                    
                    {riskCalculation.maxProfitResult && (
                        <div style={{ 
                            padding: '10px', 
                            marginBottom: '15px', 
                            background: riskCalculation.maxProfitResult.netProfit > 0 ? (darkMode ? '#0f4f3a' : '#dcfce7') : (darkMode ? '#4f0f0f' : '#fee2e2'), 
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>
                            Optimal Sale Day: {riskCalculation.maxProfitResult.date} with Net Profit: 
                            <span style={{ color: riskCalculation.maxProfitResult.netProfit >= 0 ? '#059669' : '#dc2626', marginLeft: '5px' }}>
                                ${riskCalculation.maxProfitResult.netProfit.toFixed(2)}
                            </span>
                        </div>
                    )}

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ borderBottom: `2px solid ${darkMode ? '#444' : '#ccc'}`, textAlign: 'left' }}>
                                <th style={{ padding: '8px 4px' }}>Date</th>
                                <th style={{ padding: '8px 4px' }}>Predicted Close</th>
                                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Gross Profit</th>
                                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Fees + Tax</th>
                                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Net Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {riskCalculation.results.map((r, index) => (
                                <tr 
                                    key={index} 
                                    style={{ 
                                        borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                                        background: r.netProfit === riskCalculation.maxProfitResult.netProfit ? (darkMode ? '#3b3b00' : '#fffbe7') : 'transparent'
                                    }}
                                >
                                    <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>{r.date}</td>
                                    <td style={{ padding: '8px 4px' }}>${r.predictedClose.toFixed(2)}</td>
                                    <td style={{ padding: '8px 4px', textAlign: 'right', color: r.grossProfitTotal >= 0 ? '#059669' : '#dc2626' }}>${r.grossProfitTotal.toFixed(2)}</td>
                                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>${(r.totalFees + r.taxAmount).toFixed(2)}</td>
                                    <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', color: r.netProfit >= 0 ? '#059669' : '#dc2626' }}>
                                        ${r.netProfit.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}