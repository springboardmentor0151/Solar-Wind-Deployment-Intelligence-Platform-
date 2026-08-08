import React from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export function EnergyLineChart({ solarForecast, windForecast }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = months.map((m, i) => {
    const solarVal = solarForecast ? (solarForecast[i]?.energy || 0) : 0;
    const windVal = windForecast ? (windForecast[i]?.energy || 0) : 0;
    return {
      name: m,
      Solar: Math.round(solarVal / 1000), // convert to MWh
      Wind: Math.round(windVal / 1000),
      Combined: Math.round((solarVal + windVal) / 1000)
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 10 }} />
          <YAxis stroke="#64748b" style={{ fontSize: 10 }} suffix=" MWh" />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="Solar" stroke="#F59E0B" strokeWidth={2.5} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Wind" stroke="#0EA5E9" strokeWidth={2.5} />
          <Line type="monotone" dataKey="Combined" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SitingBarChart({ solarScore, windScore, envScore }) {
  const data = [
    { name: 'Solar feasibility', Score: solarScore, fill: '#F59E0B' },
    { name: 'Wind Feasibility', Score: windScore, fill: '#0EA5E9' },
    { name: 'Environmental Siting', Score: envScore, fill: '#10B981' }
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 10 }} />
          <YAxis stroke="#64748b" style={{ fontSize: 10 }} domain={[0, 100]} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: 11 }} />
          <Bar dataKey="Score" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LandPieChart({ landArea, usableArea }) {
  const setback = Math.max(0.0, landArea - usableArea);
  const data = [
    { name: 'Usable Footprint', value: usableArea, fill: '#10B981' },
    { name: 'Setbacks & Buffers', value: setback, fill: '#ef4444' }
  ];

  return (
    <div className="h-64 w-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex space-x-4 text-[10px] font-bold text-slate-400 mt-1">
        <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span><span>Usable ({usableArea.toFixed(1)} Ha)</span></div>
        <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500"></span><span>Setbacks ({setback.toFixed(1)} Ha)</span></div>
      </div>
    </div>
  );
}

export function FinancialAreaChart({ capex, opex, annualRev }) {
  const data = [];
  let balance = -capex;
  for (let year = 0; year <= 25; year++) {
    if (year > 0) {
      // Annual revenue with 0.5% module degradation
      const rev = annualRev * Math.pow(0.995, year - 1);
      balance += (rev - opex);
    }
    data.push({
      year: `Yr ${year}`,
      Balance: Math.round(balance * 10) / 10
    });
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" stroke="#64748b" style={{ fontSize: 9 }} />
          <YAxis stroke="#64748b" style={{ fontSize: 10 }} suffix="M$" />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: 11 }} />
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="Balance" stroke="#10B981" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
