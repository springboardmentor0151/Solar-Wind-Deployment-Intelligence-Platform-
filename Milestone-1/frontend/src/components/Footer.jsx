import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaEnvelope,
  FaArrowRight,
} from "react-icons/fa";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Contact", href: "#contact" },
];

const resources = [
  { label: "Documentation", href: "#" },
  { label: "API Reference", href: "#" },
  { label: "User Guide", href: "#" },
  { label: "Support", href: "#" },
];

const socials = [
  {
    icon: FaLinkedin,
    href: "#",
    label: "LinkedIn",
  },
  {
    icon: FaGithub,
    href: "#",
    label: "GitHub",
  },
  {
    icon: FaTwitter,
    href: "#",
    label: "Twitter",
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#071122] text-white">
      {/* Background Blur */}
      <div className="absolute -top-40 left-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="grid gap-14 md:grid-cols-2 lg:grid-cols-4">
          {/* Company */}
          <div>
            <a
              href="#home"
              className="flex items-center gap-3 text-2xl font-bold"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/30">
                ⚡
              </div>

              <div>
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Solar & Wind
                </span>
                <p className="text-sm font-medium text-white/60">
                  Intelligence Platform
                </p>
              </div>
            </a>

            <p className="mt-6 leading-7 text-white/60">
              Empowering renewable energy planning through Artificial
              Intelligence, GIS analytics, environmental intelligence, and
              geospatial technologies to identify the best deployment locations
              for solar and wind farms.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-lg font-semibold">Quick Links</h3>

            <ul className="space-y-4">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="group flex items-center gap-2 text-white/60 transition hover:text-emerald-400"
                  >
                    <FaArrowRight className="text-xs opacity-0 transition-all duration-300 group-hover:opacity-100" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-6 text-lg font-semibold">Resources</h3>

            <ul className="space-y-4">
              {resources.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="group flex items-center gap-2 text-white/60 transition hover:text-cyan-400"
                  >
                    <FaArrowRight className="text-xs opacity-0 transition-all duration-300 group-hover:opacity-100" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-6 text-lg font-semibold">
              Stay Updated
            </h3>

            <p className="mb-5 text-white/60">
              Subscribe to receive updates on renewable energy intelligence,
              AI innovations, and platform releases.
            </p>

            <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/40"
              />

              <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 transition hover:scale-105">
                <FaEnvelope />
              </button>
            </div>

            {/* Social */}
            <div className="mt-8 flex gap-4">
              {socials.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white/70 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-cyan-500 hover:text-white"
                >
                  <item.icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}

        <div className="my-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Bottom */}

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-white/50 md:flex-row">
          <p>
            © 2026{" "}
            <span className="font-semibold text-white">
              Solar & Wind Deployment Intelligence Platform
            </span>
            . All Rights Reserved.
          </p>

          <div className="flex gap-6">
            <a href="#" className="hover:text-emerald-400">
              Privacy Policy
            </a>

            <a href="#" className="hover:text-emerald-400">
              Terms of Service
            </a>

            <a href="#" className="hover:text-emerald-400">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}