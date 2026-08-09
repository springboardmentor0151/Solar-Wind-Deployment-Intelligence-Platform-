import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "../services/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AuthLayout from "../layouts/AuthLayout";

function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);

            const response = await api.post(
                "/auth/login",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",
                    },
                }
            );

            localStorage.setItem(
                "access_token",
                response.data.access_token
            );

            if (response.data.full_name) {
                localStorage.setItem("user_name", response.data.full_name);
            }

            toast.success("Login Successful!");

            navigate("/dashboard");

        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.detail ||
                "Invalid Username or Password"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout subtitle="Sign in to access your deployment intelligence dashboards">
            <form onSubmit={handleLogin} className="space-y-5">
                <Input
                    label="Email"
                    type="text"
                    placeholder="you@example.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    icon={<Mail size={18} />}
                />

                <div className="relative">
                    <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
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
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign In
                                <ArrowRight size={18} />
                            </>
                        )}
                    </Button>
                </motion.div>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
                Don't have an account?{" "}
                <Link
                    to="/register"
                    className="font-semibold text-cyan-400 transition hover:text-cyan-300"
                >
                    Create one free
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

export default Login;
