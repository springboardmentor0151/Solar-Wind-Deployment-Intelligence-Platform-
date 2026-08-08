import React from 'react';
import { 
  Sun, Wind, Thermometer, CloudRain, Cloud, Compass, Map, 
  Layers, ChevronUp, Mountain, Activity, Droplets
} from 'lucide-react';

export default function EnvironmentalCards({ data }) {
  if (!data) return null;

  const cardItems = [
    { 
      label: "Ambient Temperature", 
      value: `${data.temperature}°C`, 
      sub: "Cell temperature scaling", 
      icon: Thermometer, 
      color: "text-orange-400 bg-orange-500/10 border-orange-500/20" 
    },
    { 
      label: "Relative Humidity", 
      value: `${data.humidity}%`, 
      sub: "Condensation factor", 
      icon: Droplets, 
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20" 
    },
    { 
      label: "Wind speed (10m)", 
      value: `${data.wind_speed} m/s`, 
      sub: "Log Hub height scaled", 
      icon: Wind, 
      color: "text-sky-400 bg-sky-500/10 border-sky-500/20" 
    },
    { 
      label: "Wind Direction", 
      value: `${data.wind_direction}°`, 
      sub: "Wind rose alignment", 
      icon: Compass, 
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" 
    },
    { 
      label: "Barometric Pressure", 
      value: `${data.pressure} hPa`, 
      sub: "Air density formula", 
      icon: Activity, 
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
    },
    { 
      label: "Annual Rainfall", 
      value: `${data.rainfall} mm`, 
      sub: "Erosion risk factor", 
      icon: CloudRain, 
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20" 
    },
    { 
      label: "Cloud Cover fraction", 
      value: `${data.cloud_cover}%`, 
      sub: "Clearness index model", 
      icon: Cloud, 
      color: "text-slate-400 bg-slate-500/10 border-slate-500/20" 
    },
    { 
      label: "Solar GHI Irradiance", 
      value: `${data.solar_irradiance} kWh/m²`, 
      sub: "Global Horizontal potential", 
      icon: Sun, 
      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" 
    },
    { 
      label: "Direct Normal (DNI)", 
      value: `${data.dni || 'N/A'} kWh/m²`, 
      sub: "Direct beam potential", 
      icon: Sun, 
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20" 
    },
    { 
      label: "Diffuse Horizontal (DHI)", 
      value: `${data.dhi || 'N/A'} kWh/m²`, 
      sub: "Atmospheric scatter", 
      icon: Sun, 
      color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" 
    },
    { 
      label: "Elevation height", 
      value: `${data.elevation} m`, 
      sub: "Topography elevation map", 
      icon: Mountain, 
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" 
    },
    { 
      label: "Topographic Slope", 
      value: `${data.land_slope}°`, 
      sub: "Civil grading risk", 
      icon: ChevronUp, 
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20" 
    },
    { 
      label: "Vegetation Index (NDVI)", 
      value: `${data.vegetation_index || '0.45'}`, 
      sub: "Clearance area factor", 
      icon: Layers, 
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" 
    },
    { 
      label: "Terrain Category", 
      value: data.terrain_type || 'Plains', 
      sub: "Foundational load class", 
      icon: Map, 
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" 
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cardItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className={`p-4 rounded-xl border flex items-start space-x-3 transition-all hover:scale-[1.02] ${item.color}`}>
            <div className="p-2 rounded-lg bg-slate-950/40 shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold truncate">
                {item.label}
              </span>
              <h4 className="text-md font-black text-slate-200 mt-0.5 leading-none">
                {item.value}
              </h4>
              <p className="text-[9px] text-slate-400 mt-1 font-semibold truncate">
                {item.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
