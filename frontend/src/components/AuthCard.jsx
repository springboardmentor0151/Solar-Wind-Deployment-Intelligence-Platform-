import { Link } from "react-router-dom";

export default function AuthCard({ title, subtitle, children, footerText, footerLink, footerLabel }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-white p-8 shadow-soft dark:bg-slate-900">
        <p className="text-sm font-semibold text-canopy-600">Renewable Intelligence</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-6 text-center text-sm text-slate-500">
          {footerText}{" "}
          <Link className="font-semibold text-ocean-700 hover:text-ocean-500" to={footerLink}>
            {footerLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
