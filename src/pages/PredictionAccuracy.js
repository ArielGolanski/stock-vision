import React, { useEffect, useMemo, useState } from 'react';
import HeaderMenu from '../components/HeaderMenu';
import { useTheme } from '../components/ThemeContext';
import { API_URL } from '../config';

function MetricCard({ title, value }) {
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: 8,
      border: '1px solid #ddd',
      minWidth: 160
    }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function MiniLineChart({ dates, yTrue, yPred, dark }) {
  const width = 680;
  const height = 220;
  const padding = 30;

  const series = useMemo(() => {
    if (!yTrue || !yPred || yTrue.length === 0) return null;
    const n = yTrue.length;
    const minY = Math.min(...yTrue, ...yPred);
    const maxY = Math.max(...yTrue, ...yPred);
    const scaleX = (i) => padding + (i * (width - padding * 2)) / Math.max(1, n - 1);
    const scaleY = (v) => height - padding - ((v - minY) * (height - padding * 2)) / Math.max(1, (maxY - minY) || 1);

    const toPath = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ');
    return { truePath: toPath(yTrue), predPath: toPath(yPred), minY, maxY };
  }, [yTrue, yPred]);

  if (!series) return null;
  return (
    <svg width={width} height={height} style={{ display: 'block', maxWidth: '100%' }}>
      <rect x={0} y={0} width={width} height={height} fill={dark ? '#1b1b1b' : '#fff'} />
      <path d={series.truePath} stroke={dark ? '#4caf50' : '#2e7d32'} strokeWidth={2} fill="none" />
      <path d={series.predPath} stroke={dark ? '#29b6f6' : '#0277bd'} strokeWidth={2} fill="none" opacity={0.9} />
    </svg>
  );
}

export default function PredictionAccuracy() {
  const { darkMode } = useTheme();
  const [ticker, setTicker] = useState('AAPL');
  const [peersMode, setPeersMode] = useState('fixed'); // fixed | sector
  const [windowDays, setWindowDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('The request is:', `${API_URL}/api/accuracy?ticker=${encodeURIComponent(ticker)}&windowDays=${windowDays}&horizon=1&peers=${peersMode}`)
      const resp = await fetch(`${API_URL}/api/accuracy?ticker=${encodeURIComponent(ticker)}&windowDays=${windowDays}&horizon=1&peers=${peersMode}`);
      if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
      const json = await resp.json();
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageBg = darkMode ? '#121212' : '#f7f7f7';
  const cardBg = darkMode ? '#1e1e1e' : '#ffffff';
  const textColor = darkMode ? '#f1f1f1' : '#111111';

  return (
    <div style={{ minHeight: '100vh', background: pageBg, color: textColor }}>
      <HeaderMenu />

      <div style={{ maxWidth: 1080, margin: '24px auto', padding: '0 16px' }}>
        <h2 style={{ margin: '12px 0 16px' }}>Prediction Accuracy</h2>

        <div style={{
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
          background: cardBg, border: '1px solid #ddd', borderRadius: 8, padding: 12
        }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Ticker</div>
            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
                   style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#222' : '#fff', color: textColor }}/>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Peers</div>
            <label style={{ marginRight: 8 }}><input type="radio" name="peers" value="fixed" checked={peersMode==='fixed'} onChange={() => setPeersMode('fixed')} /> Fixed</label>
            <label><input type="radio" name="peers" value="sector" checked={peersMode==='sector'} onChange={() => setPeersMode('sector')} /> Sector</label>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Window</div>
            <select value={windowDays} onChange={e => setWindowDays(parseInt(e.target.value, 10))}
                    style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#222' : '#fff', color: textColor }}>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
            </select>
          </div>
          <button onClick={fetchData} disabled={loading}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer', background: darkMode ? '#2a2a2a' : '#fafafa', color: textColor }}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, color: '#c62828' }}>{error}</div>
        )}

         {data && (
          <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
            <div style={{ background: cardBg, border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{data.base?.ticker || ticker}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <MetricCard title="Directional Accuracy" value={
                    data.base?.metrics?.directionalAccuracy !== undefined ? `${(data.base.metrics.directionalAccuracy * 100).toFixed(1)}%` : '—'
                  } />
                  <MetricCard title="MAE" value={
                    data.base?.metrics?.mae !== undefined ? data.base.metrics.mae.toFixed(3) : '—'
                  } />
                  <MetricCard title="RMSE" value={
                    data.base?.metrics?.rmse !== undefined ? data.base.metrics.rmse.toFixed(3) : '—'
                  } />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <MiniLineChart dates={data.base?.series?.dates} yTrue={data.base?.series?.yTrue} yPred={data.base?.series?.yPred} dark={darkMode} />
              </div>
            </div>

            <div style={{ background: cardBg, border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Peer Comparison</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px' }}>Ticker</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: '8px' }}>Directional</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: '8px' }}>MAE</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: '8px' }}>RMSE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.peers?.map(p => (
                      <tr key={p.ticker}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{p.ticker}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                          {p.metrics?.directionalAccuracy !== undefined ? `${(p.metrics.directionalAccuracy * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                          {p.metrics?.mae !== undefined ? p.metrics.mae.toFixed(3) : '—'}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                          {p.metrics?.rmse !== undefined ? p.metrics.rmse.toFixed(3) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {Array.isArray(data.externalProviders) && data.externalProviders.length > 0 && (
              <div style={{ background: cardBg, border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>External Providers</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '8px' }}>Provider</th>
                        <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: '8px' }}>Directional (Monthly)</th>
                        <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc', padding: '8px' }}>Samples</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.externalProviders.map((p, idx) => (
                        <tr key={`${p.provider}-${idx}`}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{p.provider}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                            {p.metrics?.directionalAccuracy !== undefined ? `${(p.metrics.directionalAccuracy * 100).toFixed(1)}%` : '—'}
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                            {p.metrics?.samples ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {typeof data.comparisonIndex === 'number' && (
              <div style={{ background: cardBg, border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 600 }}>Comparison Index</div>
                  <div title="Our directional accuracy vs avg external providers (0..100; ~50 means equal)">
                    <span style={{ fontSize: 28, fontWeight: 700 }}>{data.comparisonIndex}</span>
                    <span style={{ marginLeft: 6, opacity: 0.7 }}> / 100</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


