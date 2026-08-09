import { useState } from "react";
import api from "../services/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { Lock, KeyRound, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

function ChangePassword() {
    const [formData, setFormData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put("/auth/change-password", formData);
            setMessage(response.data.message);
            setIsError(false);
            setFormData({
                current_password: "",
                new_password: "",
                confirm_password: ""
            });
        } catch (error) {
            setMessage(error.response?.data?.detail || "Something went wrong.");
            setIsError(true);
        }
        setTimeout(() => setMessage(""), 4000);
    };

    return (
        <div className="min-h-screen bg-night-950 px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                badge="Security"
                title="Change Password"
                subtitle="Update your account password to keep your account secure."
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-xl"
            >
                <Card hover={false}>
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                            <Lock className="text-white" size={22} />
                        </div>
                        <div>
                            <h2 className="font-display text-xl font-bold text-white">Account Security</h2>
                            <p className="text-sm text-slate-400">Use a strong, unique password</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Current Password"
                            type="password"
                            name="current_password"
                            value={formData.current_password}
                            onChange={handleChange}
                            placeholder="Enter current password"
                            required
                        />
                        <Input
                            label="New Password"
                            type="password"
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            placeholder="Enter new password"
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                            required
                        />

                        <div className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-300">
                            <ShieldCheck size={18} />
                            Your password is encrypted and securely stored.
                        </div>

                        <Button type="submit" className="w-full">
                            <KeyRound size={18} /> Change Password
                        </Button>
                    </form>

                    {message && (
                        <div className={`mt-5 rounded-xl px-4 py-3 text-center font-medium ${
                            isError ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                        }`}>
                            {message}
                        </div>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}

export default ChangePassword;
