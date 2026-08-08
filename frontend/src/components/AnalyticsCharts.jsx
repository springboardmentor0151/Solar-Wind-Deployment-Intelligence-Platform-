import React from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// 1. Seasonal Generation Chart
export function SeasonalForecastChart({ solarForecast, windForecast }) {
  // Merge solar and wind forecasts
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = months.map((m, idx) => {
    const solarVal = solarForecast ? (solarForecast[idx]?.energy || 0) : 0;
    const windVal = windForecast ? (windForecast[idx]?.energy || 0) : 0;
    return {
      month: m,
      Solar: Math.round(solarVal / 1000), // convert to MWh
      Wind: Math.round(windVal / 1000),   // convert to MWh
      Total: Math.round((solarVal + windVal) / 1000)
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="solarColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="windColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="MWh" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ fontSize: '11px' }}
            labelStyle={{ fontSize: '11px', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} verticalAlign="top" height={36} />
          {solarForecast && <Area type="monotone" dataKey="Solar" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#solarColor)" />}
          {windForecast && <Area type="monotone" dataKey="Wind" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#windColor)" />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Suitability Factors Radar/Bar Comparison Chart
export function SuitabilityFactorsChart({ scores }) {
  if (!scores) return null;
  const data = [
    { subject: 'Resource', value: scores.resource_availability, fullMark: 100 },
    { subject: 'Geographic', value: scores.geographic_suitability, fullMark: 100 },
    { subject: 'Infrastructure', value: scores.infrastructure_accessibility, fullMark: 100 },
    { subject: 'Environmental', value: scores.environmental_impact, fullMark: 100 },
    { subject: 'Economic', value: scores.economic_feasibility, fullMark: 100 },
  ];

  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
          <Radar 
            name="Suitability Criteria" 
            dataKey="value" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.25} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ fontSize: '11px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. Investment Cost-Benefit Chart (20 Year Forecast - Adjusted to Indian Crores INR)
export function CostBenefitChart({ capex, opex, annualEnergyMWh, recommendedTech }) {
  const years = Array.from({ length: 20 }, (_, i) => i + 1);
  
  // Power Purchase Agreement (PPA) price assumptions in INR/kWh:
  // Solar: ~2.5 INR/kWh, Wind: ~3.0 INR/kWh
  const ppaPrice = recommendedTech === 'Solar PV' ? 2.5 : recommendedTech === 'Wind Turbines' ? 3.0 : 2.8;
  
  let cumulativeRevenue = 0;
  // Convert millions USD to equivalent Indian Crores (1 M$ approx 8.3 Crores INR)
  const initialCostCrore = capex * 8.3;
  const yearlyOpexCrore = opex * 8.3;
  
  const data = years.map(yr => {
    // 0.8% solar degradation, 1.2% wind degradation
    const degradation = recommendedTech === 'Solar PV' ? (1 - (yr - 1) * 0.008) : (1 - (yr - 1) * 0.012);
    const yearlyGenKWh = annualEnergyMWh * degradation * 1000;
    const revenueCrore = (yearlyGenKWh * ppaPrice) / 10000000; // Convert to Crore INR (1 Crore = 10^7)
    
    cumulativeRevenue += (revenueCrore - yearlyOpexCrore);
    const netReturnCrore = cumulativeRevenue - initialCostCrore;
    
    return {
      year: `Yr ${yr}`,
      "Net Return": Math.round(netReturnCrore * 10) / 10, // in Crores INR
      "Capex Line": -Math.round(initialCostCrore * 10) / 10,
      "Break Even": 0
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" stroke="#94a3b8" fontSize={9} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} unit="Cr" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ fontSize: '11px' }}
            formatter={(value) => [`₹${value.toLocaleString()} Cr`]}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} verticalAlign="top" height={36} />
          <Area type="monotone" dataKey="Net Return" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.1} />
          <Line type="dashed" dataKey="Break Even" stroke="#ef4444" strokeWidth={1} dot={false} legendType="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 4. India State-wise Capacity Chart (Solar vs Wind - Requirement 10/11)
export function IndiaStateCapacityChart() {
  const data = [
    { state: 'Rajasthan', Solar: 18000, Wind: 5200 },
    { state: 'Gujarat', Solar: 10400, Wind: 9900 },
    { state: 'Tamil Nadu', Solar: 6800, Wind: 9800 },
    { state: 'Karnataka', Solar: 7800, Wind: 5000 },
    { state: 'Andhra', Solar: 4500, Wind: 4100 },
    { state: 'Maharashtra', Solar: 2900, Wind: 5000 },
    { state: 'Madhya Pradesh', Solar: 3000, Wind: 100 }
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="state" stroke="#94a3b8" fontSize={9} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} unit="MW" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ fontSize: '11px' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} verticalAlign="top" height={36} />
          <Bar dataKey="Solar" fill="#f59e0b" name="Solar (MW)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Wind" fill="#0ea5e9" name="Wind (MW)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
