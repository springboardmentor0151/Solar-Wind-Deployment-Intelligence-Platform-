import styles from "./Sidebar.module.css";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  FolderKanban,
  MapPinned,
  Sun,
  Brain,
  BarChart3,
  Activity,
  LogOut,
  Globe,
} from "lucide-react";

function Sidebar() {
  return (
    <motion.aside
      className={styles.sidebar}
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div>
        {/* Logo */}
        <div className={styles.logoBox}>
          <div className={styles.logoCircle}>☀</div>

          <div>
            <h2>SolarWind</h2>
            <span>Deployment Intelligence</span>
          </div>
        </div>

        <div className={styles.menuTitle}>MAIN MENU</div>

        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive
              ? `${styles.menu} ${styles.active}`
              : styles.menu
          }
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        {/* Projects */}
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            isActive
              ? `${styles.menu} ${styles.active}`
              : styles.menu
          }
        >
          <FolderKanban size={20} />
          Projects
        </NavLink>

        {/* Sites */}
        <NavLink
          to="/sites"
          className={({ isActive }) =>
            isActive
              ? `${styles.menu} ${styles.active}`
              : styles.menu
          }
        >
          <MapPinned size={20} />
          Sites
        </NavLink>

        {/* Environment */}
        <NavLink
          to="/environment"
          className={({ isActive }) =>
            isActive
              ? `${styles.menu} ${styles.active}`
              : styles.menu
          }
        >
          <Sun size={20} />
          Environment
        </NavLink>

        {/* GIS */}
        <NavLink
          to="/gis"
          className={({ isActive }) =>
            isActive
              ? `${styles.menu} ${styles.active}`
              : styles.menu
          }
        >
          <Globe size={20} />
          GIS Intelligence
        </NavLink>

        {/* AI Prediction */}
        <NavLink
          to="/prediction"
          className={({ isActive }) =>
            isActive
              ? `${styles.menu} ${styles.active}`
              : styles.menu
          }
        >
          <Brain size={20} />
          AI Prediction
        </NavLink>

        {/* Analytics */}
        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            isActive
              ? `${styles.menu} ${styles.active}`
              : styles.menu
          }
        >
          <BarChart3 size={20} />
          Analytics
        </NavLink>

        {/* System Health */}
        <div className={styles.healthCard}>
          <Activity size={20} />

          <div>
            <small>System Health</small>
            <h4>Healthy</h4>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className={styles.profileCard}>
        <div className={styles.profileLeft}>
          <div className={styles.avatar}>S</div>

          <div>
            <h4>Sahithi</h4>
            <small>Administrator</small>
          </div>
        </div>

        <LogOut size={20} className={styles.logout} />
      </div>
    </motion.aside>
  );
}

export default Sidebar;