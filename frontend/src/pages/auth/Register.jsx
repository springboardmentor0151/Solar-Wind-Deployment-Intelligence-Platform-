import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Sun, Eye, EyeOff } from "lucide-react";
import * as authApi from "../../api/authApi.js";
import { extractErrorMessage } from "../../api/axiosClient.js";
import Button from "../../components/ui/Button.jsx";
import { REGISTERABLE_ROLES } from "../../utils/roles.js";

const schema = z
  .object({
    full_name: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    confirm_password: z.string().min(1, "Confirm your password"),
    role_id: z.coerce
      .number({ invalid_type_error: "Select a role" })
      .refine((v) => REGISTERABLE_ROLES.some((r) => r.role_id === v), {
        message: "Select a valid role",
      }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      await authApi.register({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
        role_id: values.role_id,
      });
      toast.success("Account created \u2014 you can now sign in");
      navigate("/login", { replace: true });
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500">
            <Sun className="h-5 w-5 text-navy-950" />
          </div>
          <h1 className="text-lg font-semibold text-white">Helios Grid</h1>
          <p className="mt-1 text-xs uppercase tracking-wide text-navy-600">
            Solar &amp; Wind Deployment Intelligence
          </p>
        </div>

        <div className="rounded-xl border border-navy-800 bg-navy-900 p-6 shadow-popover">
          <h2 className="mb-1 text-sm font-semibold text-white">
            Create your account
          </h2>
          <p className="mb-5 text-xs text-navy-600">
            Choose the role you will use on the deployment workflow.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy-600">
                Full name
              </label>
              <input
                type="text"
                autoComplete="name"
                className="h-9 w-full rounded-md border border-navy-700 bg-navy-800 px-3 text-sm text-white placeholder:text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                placeholder="Jane Doe"
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-danger-500">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy-600">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                className="h-9 w-full rounded-md border border-navy-700 bg-navy-800 px-3 text-sm text-white placeholder:text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                placeholder="you@company.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-danger-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy-600">
                Role
              </label>
              <select
                defaultValue=""
                className="h-9 w-full rounded-md border border-navy-700 bg-navy-800 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                {...register("role_id")}
              >
                <option value="" disabled>
                  Select a role
                </option>
                {REGISTERABLE_ROLES.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {errors.role_id && (
                <p className="mt-1 text-xs text-danger-500">
                  {errors.role_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy-600">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="h-9 w-full rounded-md border border-navy-700 bg-navy-800 px-3 pr-9 text-sm text-white placeholder:text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-600 hover:text-white"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy-600">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="h-9 w-full rounded-md border border-navy-700 bg-navy-800 px-3 pr-9 text-sm text-white placeholder:text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  {...register("confirm_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-600 hover:text-white"
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-xs text-danger-500">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            {submitError && (
              <div className="rounded-md border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-xs text-danger-500">
                {submitError}
              </div>
            )}

            <Button
              type="submit"
              variant="brand"
              className="w-full"
              isLoading={isSubmitting}
            >
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-navy-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-500 hover:text-brand-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
