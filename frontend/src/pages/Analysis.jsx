import LocationSearch from "../components/location/LocationSearch";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
    MapPinned,
    Sun,
    Wind,
    Mountain,
    BadgeCheck,
    ArrowLeft,
    RotateCcw,
    Search,
    TrendingUp,
    Coins,
    Target,
    Gauge as GaugeIcon,
    AlertTriangle,
    CheckCircle2,
    Globe,
    Sprout,
    Layers,
    BarChart3,
} from "lucide-react";

import SiteMap from "../components/map/SiteMap";
import api from "../services/api";

import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Gauge from "../components/ui/Gauge";
import ProgressBar from "../components/ui/ProgressBar";
import AnimatedCounter from "../components/ui/AnimatedCounter";

const delay = (i, base = 0.2) => ({ transition: { delay: base + i * 0.08 } });

export default function Analysis() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const analyzeSite = async () => {
        if (!selectedLocation) return;
        setLoading(true);
        try {
            const res = await api.post(
                "/analysis/report",
                {
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                }
            );
            setReport(res.data);
        } catch (err) {
            console.error(err);
            alert("Analysis failed.");
        }
        setLoading(false);
    };

    const resetAnalysis = () => {
        setReport(null);
        setSelectedLocation(null);
    };

    const riskColor = (risk) => {
        const map = { Low: "emerald", Medium: "amber", High: "red" };
        return map[risk] || "slate";
    };

    const priorityColor = (p) => {
        const map = { High: "emerald", Medium: "amber", Low: "slate" };
        return map[p] || "slate";
    };

    const complexityColor = (c) => {
        const map = { Easy: "emerald", Moderate: "amber", Difficult: "red" };
        return map[c] || "slate";
    };

const callout = (icon, label, value, color) => (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    <h4 className="mt-0.5 font-display text-lg font-semibold text-white">{value}</h4>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="min-h-screen bg-night-950 px-4 py-8 sm:px-6 lg:px-8">
                <PageHeader
                    badge="Analysis"
                    title="Environmental Intelligence"
                    subtitle="Analyze renewable energy suitability using multi-source environmental data, forecasting and investment modeling."
                    action={
                        report && (
                            <div className="flex flex-wrap gap-3">
                                <Button variant="secondary" onClick={resetAnalysis}>
                                    <ArrowLeft size={18} /> Back
                                </Button>
                                <Button onClick={resetAnalysis}>
                                    <RotateCcw size={18} /> Analyze Another Site
                                </Button>
                            </div>
                        )
                    }
                />

                {/* Selector */}
                <AnimatePresence mode="wait">
                    {!report && (
                        <motion.div
                            key="selector"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass-strong rounded-3xl p-6 md:p-8"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                                    <Search className="text-white" size={24} />
                                </div>
                                <div>
                                    <h2 className="font-display text-2xl font-bold text-white">Select Deployment Site</h2>
                                    <p className="text-slate-400">Choose a renewable energy site for environmental assessment.</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-6">
                                <LocationSearch onLocationSelect={setSelectedLocation} />

                                {selectedLocation && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6"
                                    >
                                        <div className="flex items-center gap-2">
                                            <MapPinned className="text-cyan-400" size={20} />
                                            <h3 className="font-display text-lg font-semibold text-cyan-300">Selected Location</h3>
                                        </div>
                                        <p className="mt-3 text-white">{selectedLocation.name}</p>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div className="rounded-xl bg-white/[0.03] p-4">
                                                <p className="text-xs text-slate-400">Latitude</p>
                                                <p className="mt-1 font-mono font-semibold text-white">{selectedLocation.latitude}</p>
                                            </div>
                                            <div className="rounded-xl bg-white/[0.03] p-4">
                                                <p className="text-xs text-slate-400">Longitude</p>
                                                <p className="mt-1 font-mono font-semibold text-white">{selectedLocation.longitude}</p>
                                            </div>
                                        </div>
                                        <Button className="mt-6 w-full" onClick={analyzeSite} disabled={loading}>
                                            {loading ? "Analyzing..." : "Analyze Location"}
                                        </Button>
                                    </motion.div>
                                )}

                                {loading && (
                                    <p className="flex items-center gap-2 text-cyan-400">
                                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-energy-pulse" />
                                        Generating renewable energy assessment...
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {report && (
                        <motion.div
                            key="report"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mt-8 space-y-8"
                        >
                            {/* Overall Score Hero */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative overflow-hidden rounded-3xl glass-strong p-8"
                            >
                                <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl animate-aurora" />
                                <div className="absolute -bottom-20 left-0 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl animate-aurora" style={{ animationDelay: "-5s" }} />
                                <div className="relative z-10 grid gap-8 md:grid-cols-3 md:items-center">
                                    <div className="md:col-span-2">
                                        <div className="flex items-center gap-2">
                                            <BadgeCheck className="text-cyan-400" size={24} />
                                            <h2 className="font-display text-2xl font-bold text-white">Resource Assessment</h2>
                                        </div>
                                        <p className="mt-4 text-2xl font-semibold text-green-300 md:text-3xl">
                                            {report.recommendation}
                                        </p>
                                        <div className="mt-6 space-y-4">
                                            <div>
                                                <div className="mb-1.5 flex justify-between text-sm">
                                                    <span className="text-slate-400">Overall Suitability</span>
                                                    <span className="font-semibold text-white">{report.overall_score}/100</span>
                                                </div>
                                                <ProgressBar value={report.overall_score} max={100} showLabel={false} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="mb-1.5 flex justify-between text-sm">
                                                        <span className="text-slate-400">Solar</span>
                                                        <span className="font-semibold text-yellow-300">{report.solar.score}/100</span>
                                                    </div>
                                                    <ProgressBar value={report.solar.score} max={100} color="from-yellow-400 to-orange-500" />
                                                </div>
                                                <div>
                                                    <div className="mb-1.5 flex justify-between text-sm">
                                                        <span className="text-slate-400">Wind</span>
                                                        <span className="font-semibold text-blue-300">{report.wind.score}/100</span>
                                                    </div>
                                                    <ProgressBar value={report.wind.score} max={100} color="from-blue-400 to-cyan-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-center">
                                        <Gauge value={report.overall_score} max={100} size={190} color="#22d3ee" label="Score" sublabel={report.site_suitability?.category} />
                                    </div>
                                </div>

                                {/* Recommendation chips */}
                                <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                        <p className="text-xs text-slate-400">Recommended Deployment</p>
                                        <p className="mt-1 font-display text-lg font-semibold text-cyan-300">{report.deployment.recommended_deployment}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                        <p className="text-xs text-slate-400">Project Size</p>
                                        <p className="mt-1 font-display text-lg font-semibold text-violet-300">{report.deployment.project_size}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                        <p className="text-xs text-slate-400">Construction Complexity</p>
                                        <p className="mt-1 font-display text-lg font-semibold text-white">{report.deployment.construction_complexity}</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Location + Solar + Wind + Terrain */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} {...delay(0)}>
                                    <Card hover={false} className="h-full">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-500 shadow-lg">
                                                <Globe className="text-white" size={22} />
                                            </div>
                                            <h3 className="font-display text-xl font-bold text-white">Location</h3>
                                        </div>
                                        <div className="mt-5 space-y-2 text-sm text-slate-300">
                                            <p><span className="text-slate-500">Country:</span> <span className="font-medium text-white">{report.location.country}</span></p>
                                            <p><span className="text-slate-500">State:</span> <span className="font-medium text-white">{report.location.state}</span></p>
                                            <p><span className="text-slate-500">District:</span> <span className="font-medium text-white">{report.location.district}</span></p>
                                            <p><span className="text-slate-500">City:</span> <span className="font-medium text-white">{report.location.city}</span></p>
                                        </div>
                                    </Card>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} {...delay(1)}>
                                    <Card hover={false} className="h-full">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                                                <Sun className="text-white" size={22} />
                                            </div>
                                            <h3 className="font-display text-xl font-bold text-white">Solar Analysis</h3>
                                        </div>
                                        <div className="mt-5 flex items-end justify-between">
                                            <div>
                                                <p className="text-xs text-slate-400">Global Horizontal Irradiance</p>
                                                <p className="mt-1 font-display text-4xl font-bold text-yellow-300">
                                                    <AnimatedCounter value={report.solar.ghi} decimals={2} /> <span className="text-lg text-slate-400">kWh/m²</span>
                                                </p>
                                            </div>
                                            <Badge color="amber">{report.solar.category}</Badge>
                                        </div>
                                        <div className="mt-5 space-y-3 text-sm">
                                            <p className="text-slate-400">Temperature <span className="float-right font-medium text-white">{report.solar.temperature} °C</span></p>
                                            <ProgressBar value={report.solar.score} max={100} color="from-yellow-400 to-orange-500" />
                                            <p className="text-slate-400">Solar Score <span className="float-right font-semibold text-yellow-300">{report.solar.score}/100</span></p>
                                        </div>
                                    </Card>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} {...delay(2)}>
                                    <Card hover={false} className="h-full">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 shadow-lg">
                                                <Wind className="text-white" size={22} />
                                            </div>
                                            <h3 className="font-display text-xl font-bold text-white">Wind Analysis</h3>
                                        </div>
                                        <div className="mt-5 flex items-end justify-between">
                                            <div>
                                                <p className="text-xs text-slate-400">Wind Speed</p>
                                                <p className="mt-1 font-display text-4xl font-bold text-blue-300">
                                                    <AnimatedCounter value={report.wind.speed} decimals={2} /> <span className="text-lg text-slate-400">m/s</span>
                                                </p>
                                            </div>
                                            <Badge color="blue">{report.wind.category}</Badge>
                                        </div>
                                        <div className="mt-5 space-y-3 text-sm">
                                            <p className="text-slate-400">Power Density <span className="float-right font-medium text-white">{report.wind.power_density} W/m²</span></p>
                                            <ProgressBar value={report.wind.score} max={100} color="from-blue-400 to-cyan-400" />
                                            <p className="text-slate-400">Wind Score <span className="float-right font-semibold text-blue-300">{report.wind.score}/100</span></p>
                                        </div>
                                    </Card>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} {...delay(3)}>
                                    <Card hover={false} className="h-full">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg">
                                                <Mountain className="text-white" size={22} />
                                            </div>
                                            <h3 className="font-display text-xl font-bold text-white">Terrain</h3>
                                        </div>
                                        <div className="mt-5 flex items-end justify-between">
                                            <div>
                                                <p className="text-xs text-slate-400">Elevation</p>
                                                <p className="mt-1 font-display text-4xl font-bold text-emerald-300">
                                                    <AnimatedCounter value={report.terrain.elevation} /> <span className="text-lg text-slate-400">m</span>
                                                </p>
                                            </div>
                                            <Sprout className="text-emerald-400/40" size={32} />
                                        </div>
                                        <div className="mt-5 space-y-3 text-sm">
                                            <p className="text-slate-400">Source <span className="float-right font-medium text-white">{report.terrain.source}</span></p>
                                            <p className="text-slate-400">Complexity <span className="float-right font-medium text-white">{report.deployment.construction_complexity}</span></p>
                                        </div>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Deployment Recommendation */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} {...delay(4)}>
                                <Card hover={false}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                                            <Target className="text-white" size={22} />
                                        </div>
                                        <h2 className="font-display text-xl font-bold text-white">Deployment Recommendation</h2>
                                    </div>
                                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        {callout(<Sun className="text-white" size={20} />, "Recommended Deployment", report.deployment.recommended_deployment, "from-cyan-500 to-blue-500")}
                                        {callout(<AlertTriangle className="text-white" size={20} />, "Investment Risk", report.deployment.investment_risk, "from-red-500 to-orange-500")}
                                        {callout(<TrendingUp className="text-white" size={20} />, "Deployment Priority", report.deployment.deployment_priority, "from-emerald-500 to-teal-400")}
                                        {callout(<Layers className="text-white" size={20} />, "Project Size", report.deployment.project_size, "from-violet-500 to-purple-400")}
                                    </div>
                                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                            <p className="text-xs text-slate-400">Risk</p>
                                            <Badge color={riskColor(report.deployment.investment_risk)} className="mt-2">{report.deployment.investment_risk}</Badge>
                                        </div>
                                        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                            <p className="text-xs text-slate-400">Priority</p>
                                            <Badge color={priorityColor(report.deployment.deployment_priority)} className="mt-2">{report.deployment.deployment_priority}</Badge>
                                        </div>
                                        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                            <p className="text-xs text-slate-400">Complexity</p>
                                            <Badge color={complexityColor(report.deployment.construction_complexity)} className="mt-2">{report.deployment.construction_complexity}</Badge>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Forecast */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} {...delay(5)}>
                                <Card hover={false}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg">
                                            <BarChart3 className="text-white" size={22} />
                                        </div>
                                        <h2 className="font-display text-xl font-bold text-white">Energy Forecast</h2>
                                    </div>
                                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        {callout(<TrendingUp className="text-white" size={20} />, "Future Potential", report.forecast.future_potential, "from-emerald-500 to-teal-400")}
                                        {callout(<TrendingUp className="text-white" size={20} />, "Growth Trend", report.forecast.growth_trend, "from-cyan-500 to-blue-500")}
                                        {callout(<GaugeIcon className="text-white" size={20} />, "Forecast Confidence", report.forecast.confidence, "from-amber-400 to-orange-500")}
                                        {callout(<Sprout className="text-white" size={20} />, "Prediction", report.forecast.prediction, "from-violet-500 to-purple-400")}
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Investment */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} {...delay(6)}>
                                <Card hover={false}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                                            <Coins className="text-white" size={22} />
                                        </div>
                                        <h2 className="font-display text-xl font-bold text-white">Investment Recommendation</h2>
                                    </div>
                                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        {callout(<CheckCircle2 className="text-white" size={20} />, "Investment Decision", report.investment.decision, "from-green-500 to-emerald-500")}
                                        {callout(<TrendingUp className="text-white" size={20} />, "Estimated ROI", report.investment.estimated_roi, "from-cyan-500 to-blue-500")}
                                        {callout(<Target className="text-white" size={20} />, "Investment Level", report.investment.investment_level, "from-amber-400 to-orange-500")}
                                        {callout(<Coins className="text-white" size={20} />, "Payback Period", report.investment.payback_period, "from-violet-500 to-purple-400")}
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Interactive Map */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} {...delay(7)}>
                                <Card hover={false}>
                                    <div className="mb-6 flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg">
                                            <MapPinned className="text-white" size={22} />
                                        </div>
                                        <h2 className="font-display text-xl font-bold text-white">Interactive Deployment Map</h2>
                                    </div>
                                    <SiteMap />
                                </Card>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
