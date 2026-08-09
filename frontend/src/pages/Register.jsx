import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "../services/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AuthLayout from "../layouts/AuthLayout";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        role: "user",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/auth/register", formData);

            toast.success("Registration Successful!");

            navigate("/login");
        } catch (error) {
            toast.error(
                error.response?.data?.detail ||
                "Registration Failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout subtitle="Create your account to get started">
            <form onSubmit={handleRegister} className="space-y-5">
                <Input
                    label="Full Name"
                    type="text"
                    name="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    icon={<User size={18} />}
                />

                <Input
                    label="Email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    icon={<Mail size={18} />}
                />

                <div className="relative">
                    <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        icon={<Lock size={18} />}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-[42px] text-slate-400 transition hover:text-white"
                        aria-label="Toggle password visibility"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                        Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: "user", label: "User" },
                            { value: "admin", label: "Admin" },
                        ].map((opt) => (
                            <label
                                key={opt.value}
                                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
                                    formData.role === opt.value
                                        ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                                        : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value={opt.value}
                                    checked={formData.role === opt.value}
                                    onChange={handleChange}
                                    className="sr-only"
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            <>
                                Create Account
                                <ArrowRight size={18} />
                            </>
                        )}
                    </Button>
                </motion.div>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                    to="/login"
                    className="font-semibold text-cyan-400 transition hover:text-cyan-300"
                >
                    Sign in
                </Link>
            </div>

            <div className="mt-6">
                <Link
                    to="/"
                    className="block text-center text-xs text-slate-500 transition hover:text-slate-300"
                >
                    ← Back to home
                </Link>
            </div>
        </AuthLayout>
    );
}

export default Register;
