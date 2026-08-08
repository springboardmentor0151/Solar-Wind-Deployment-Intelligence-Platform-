import React from 'react';
import GeoEnergyLogo from '../components/GeoEnergyLogo';
import { 
  Sun, 
  Wind, 
  Map, 
  Globe, 
  TrendingUp, 
  Cpu, 
  FileText, 
  Activity, 
  ArrowRight, 
  Shield, 
  Zap, 
  CloudRain, 
  Database, 
  CheckCircle2
} from 'lucide-react';

export default function LandingView({ navigate }) {
  
  const scrollToFeatures = (e) => {
    e.preventDefault();
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 font-sans selection:bg-[#16A34A]/30 selection:text-[#16A34A] overflow-x-hidden relative">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-950/10 blur-[120px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-blue-950/10 blur-[120px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full bg-amber-950/5 blur-[120px] animate-pulse-slow pointer-events-none"></div>

      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 h-20 border-b border-slate-800/40 bg-[#070a13]/80 backdrop-blur-md px-6 md:px-12 flex justify-between items-center z-50">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <GeoEnergyLogo type="full" size="normal" />
        </div>

        <div className="flex items-center space-x-6">
          <a href="#features-section" onClick={scrollToFeatures} className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors hidden md:block">
            Features
          </a>
          <a href="#how-it-works-section" className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors hidden md:block" onClick={(e) => {
            e.preventDefault();
            document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Workflow
          </a>
          <button 
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-4 py-2 bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#16A34A]/10 border border-[#16A34A]/25 rounded-full text-xs font-bold text-[#16A34A] mb-6">
          <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Smart Renewable Energy Intelligence</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white max-w-4xl leading-tight">
          Solar & Wind Deployment <br className="hidden md:inline" />
          <span className="bg-gradient-to-r from-[#16A34A] via-[#0EA5E9] to-[#F59E0B] bg-clip-text text-transparent">
            Intelligence Platform
          </span>
        </h1>
        
        <p className="text-slate-400 text-sm md:text-md max-w-2xl mt-6 leading-relaxed">
          Plan renewable energy projects using AI, GIS, weather intelligence, environmental analysis and smart recommendations. Accelerate green investment decision-making.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <button 
            onClick={() => navigate('/register')}
            className="px-6 py-3 bg-gradient-to-r from-[#16A34A] via-[#0EA5E9] to-[#F59E0B] hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center space-x-2 animate-bounce-slow"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            Sign In
          </button>
          <button 
            onClick={scrollToFeatures}
            className="px-6 py-3 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all"
          >
            Learn More
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 px-6 md:px-12 border-t border-slate-900 bg-slate-950/40 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-bold text-[#0EA5E9] uppercase tracking-widest block mb-2">Capabilities</span>
            <h2 className="text-2xl md:text-3xl font-black text-white">Full-Spectrum Feasibility Dashboard</h2>
            <p className="text-xs text-slate-500 mt-2">Evaluate GIS terrain files, predictive solar irradiance, and turbulent wind shears instantly.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Solar */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-6 rounded-2xl glass hover:border-[#F59E0B]/30 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B] mb-4">
                <Sun className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-2">☀ Solar Analysis</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Analyze GHI irradiance, bifacial module layouts, shading limits, and expected peak sun hours.
              </p>
            </div>

            {/* Wind */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-6 rounded-2xl glass hover:border-[#0EA5E9]/30 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center text-[#0EA5E9] mb-4">
                <Wind className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-2">💨 Wind Prediction</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Model hub wind shear velocities, capacity factors, and turbulence intensity across various heights.
              </p>
            </div>

            {/* GIS Mapping */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-6 rounded-2xl glass hover:border-[#16A34A]/30 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center text-[#16A34A] mb-4">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-2">🗺 GIS Mapping</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Layer topographic slope matrices, elevation profiles, soil ratings, and conservation zones.
              </p>
            </div>

            {/* Global Selection */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-6 rounded-2xl glass hover:border-slate-700 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-2">🌍 Global Site Selection</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Evaluate any latitude and longitude worldwide. Query Nominatim reverse geocoders and weather APIs.
              </p>
            </div>

            {/* Forecasting */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-6 rounded-2xl glass hover:border-slate-700 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-2">📈 Energy Forecasting</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Predict seasonal yields, monthly distributions, and 25-year energy decay curves.
              </p>
            </div>

            {/* AI Recommendation */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-6 rounded-2xl glass hover:border-slate-700 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-2">🤖 AI Recommendation Engine</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Determine optimal generation split sizes (Solar, Wind, Hybrid) using multi-objective metrics.
              </p>
            </div>

            {/* Reports */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-6 rounded-2xl glass hover:border-slate-700 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500 mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-2">📄 PDF Reports</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Download printable, publication-grade HTML-to-PDF feasibility sheets and Excel data sheets.
              </p>
            </div>

            {/* Analytics */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-6 rounded-2xl glass hover:border-slate-700 transition-all hover:-translate-y-1">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-2">📊 Analytics Dashboard</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Review ROI summaries, OPEX forecasts, construction timelines, and project comparisons.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works-section" className="py-20 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-widest block mb-2">Workflow</span>
            <h2 className="text-2xl md:text-3xl font-black text-white">How GeoEnergy AI Works</h2>
            <p className="text-xs text-slate-500 mt-2">Take a project from concept to detailed evaluation in four simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-[#0EA5E9] text-[#0EA5E9] font-extrabold text-sm flex items-center justify-center shadow-lg shadow-[#0EA5E9]/10 z-10 mb-4">
                01
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Select a Project</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Choose an existing platform project or create a new one to hold your analysis nodes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-[#16A34A] text-[#16A34A] font-extrabold text-sm flex items-center justify-center shadow-lg shadow-[#16A34A]/10 z-10 mb-4">
                02
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Select Location on Map</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Explore the global world map, search coordinates, and place markers on target sites.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-[#F59E0B] text-[#F59E0B] font-extrabold text-sm flex items-center justify-center shadow-lg shadow-[#F59E0B]/10 z-10 mb-4">
                03
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">AI Analyzes Site</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Calculates environmental risks, meteorological variables, and sizing capacity in memory.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-purple-500 text-purple-400 font-extrabold text-sm flex items-center justify-center shadow-lg shadow-purple-500/10 z-10 mb-4">
                04
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Get Recommendations & Save</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Review ROI, CAPEX calculations, and confirm saving the site to your project.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 md:px-12 border-t border-slate-900 bg-slate-950/40 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest block mb-2">Benefits</span>
            <h2 className="text-2xl md:text-3xl font-black text-white">Reap the Benefits of GeoEnergy AI</h2>
            <p className="text-xs text-slate-500 mt-2">Empowering teams with accurate, multi-objective assessment layers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Card 1 */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-5 rounded-xl glass text-center hover:border-[#16A34A]/20 transition-all">
              <Cpu className="w-6 h-6 text-[#16A34A] mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">AI Powered</h4>
              <p className="text-[10px] text-slate-500 leading-normal">ML predictions size capacities and suggest optimization layouts.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-5 rounded-xl glass text-center hover:border-[#0EA5E9]/20 transition-all">
              <Globe className="w-6 h-6 text-[#0EA5E9] mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">Global GIS</h4>
              <p className="text-[10px] text-slate-500 leading-normal">Slope calculations, elevations, and reverse geocoding globally.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-5 rounded-xl glass text-center hover:border-[#F59E0B]/20 transition-all">
              <CloudRain className="w-6 h-6 text-[#F59E0B] mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">Weather Intel</h4>
              <p className="text-[10px] text-slate-500 leading-normal">Live query endpoints pull weather histories and forecasts.</p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-5 rounded-xl glass text-center hover:border-purple-500/20 transition-all">
              <DollarSignIcon className="w-6 h-6 text-purple-400 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">Investment Plan</h4>
              <p className="text-[10px] text-slate-500 leading-normal">Complete OPEX, CAPEX, ROI percentages, and payback logs.</p>
            </div>

            {/* Card 5 */}
            <div className="bg-[#111827]/40 border border-slate-800/80 p-5 rounded-xl glass text-center hover:border-indigo-500/20 transition-all">
              <CheckCircle2 className="w-6 h-6 text-indigo-400 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">RE Optimization</h4>
              <p className="text-[10px] text-slate-500 leading-normal">Optimizes infrastructure layout for maximum yields.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-6 md:px-12 relative z-10 text-center border-t border-slate-900 bg-gradient-to-b from-[#070a13] to-slate-950">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white">
            Ready to Accelerate Your Renewable Deployments?
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Get instant, AI-guided site assessments, predictive modeling, and economic analysis curves for any coordinates on the planet.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3.5 bg-gradient-to-r from-[#16A34A] via-[#0EA5E9] to-[#F59E0B] hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-500/10 inline-flex items-center space-x-2"
            >
              <span>Initialize Deployment Evaluation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="border-t border-slate-900 bg-[#070a13] py-12 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <GeoEnergyLogo type="icon" className="w-8 h-8" />
            <span className="text-xs font-bold text-slate-400">© 2026 GeoEnergy AI - Solar & Wind Deployment Intelligence Platform.</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-[11px] font-bold text-slate-500">
            <a href="#" className="hover:text-slate-400 transition-colors">About</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Contact</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors flex items-center">
              <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}

// Auxiliary Dollar Icon
function DollarSignIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
