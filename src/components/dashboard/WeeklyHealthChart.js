import React from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  ComposedChart
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.98)',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '1rem',
        color: '#000000',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        fontSize: '0.85rem',
        minWidth: '200px'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '0.75rem', color: '#4682B4', fontSize: '0.9rem' }}>{label}</p>
        
        {payload.map((entry, index) => {
          if (entry.dataKey === 'sleepQualityPercent') {
            return (
              <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Sleep Quality: {entry.value}%</span>
              </div>
            );
          }
          if (entry.dataKey === 'stressPercent') {
            return (
              <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Stress Level: {entry.value}%</span>
              </div>
            );
          }
          if (entry.dataKey === 'headaches') {
            return (
              <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Headaches: {entry.value}</span>
              </div>
            );
          }
          if (entry.dataKey === 'avgPainLevelPercent') {
            return (
              <div key={index} style={{ margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: entry.color, borderRadius: '50%' }} />
                <span style={{ color: '#4B5563', fontSize: '0.85rem' }}>Avg Pain: {Math.round(entry.value)}%</span>
              </div>
            );
          }
          return null;
        })}
        
        {data?.headachesByIntensity && Object.keys(data.headachesByIntensity).length > 0 && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: 'rgba(70, 130, 180, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(70, 130, 180, 0.1)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#4682B4' }}>
              <i className="fas fa-head-side-virus" style={{ marginRight: '0.3rem' }}></i>
              Headache Details:
            </div>
            {Object.entries(data.headachesByIntensity).map(([intensity, count]) => (
              <div key={intensity} style={{ margin: '0.3rem 0', fontSize: '0.75rem', color: '#4B5563' }}>
                • {count} headache{count > 1 ? 's' : ''} at {intensity}/10 intensity
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function WeeklyHealthChart({ data }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '16px',
      padding: '1rem',
      marginBottom: '3rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      overflow: 'hidden'
    }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h3 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '1.4rem', 
          fontWeight: '600',
          color: '#1E3A8A'
        }}>
          Weekly Health Overview
        </h3>
        <p style={{ 
          color: '#4B5563', 
          fontSize: '0.9rem', 
          margin: 0
        }}>
          Sleep quality, stress levels & headache tracking
        </p>
      </div>
      
      {data.some(d => d.hasData) ? (
        <div style={{ width: '100%', height: '400px', minWidth: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={data} 
              margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="sleepQualityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#20c997" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#20c997" stopOpacity={0.4}/>
                </linearGradient>
                <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc3545" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#dc3545" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(75, 85, 99, 0.2)" />
              <XAxis 
                dataKey="day" 
                stroke="#4B5563"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="scale" 
                orientation="left" 
                domain={[0, 100]} 
                stroke="#4B5563"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <YAxis 
                yAxisId="count" 
                orientation="right" 
                domain={[0, 5]} 
                stroke="#4B5563"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '15px', color: '#4B5563', fontSize: '12px' }}
                iconType="circle"
              />
              
              <Bar 
                yAxisId="scale"
                dataKey="sleepQualityPercent" 
                fill="url(#sleepQualityGradient)"
                name="Sleep Quality %"
                radius={[2, 2, 0, 0]}
                maxBarSize={25}
              />
              
              <Bar 
                yAxisId="scale"
                dataKey="stressPercent" 
                fill="url(#stressGradient)"
                name="Stress Level %"
                radius={[2, 2, 0, 0]}
                maxBarSize={25}
              />
              
              <Line 
                yAxisId="count"
                type="monotone" 
                dataKey="headaches" 
                stroke="#4682B4" 
                strokeWidth={3}
                name="Headache Count"
                dot={{ fill: '#4682B4', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#4682B4', strokeWidth: 2 }}
              />
              
              <Line 
                yAxisId="scale"
                type="monotone" 
                dataKey="avgPainLevelPercent" 
                stroke="#ff6b35" 
                strokeWidth={3}
                strokeDasharray="5 5"
                name="Avg Headache Intensity %"
                dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ff6b35', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: '#9CA3AF',
          fontSize: '1.1rem'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
            <i className="fas fa-chart-area"></i>
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '500' }}>No data available yet</p>
          <p style={{ fontSize: '1rem', margin: '0', lineHeight: '1.5' }}>
            Start tracking your sleep, stress, and headaches to see patterns here!
          </p>
        </div>
      )}
    </div>
  );
}
