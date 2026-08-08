import Sidebar from "../components/Sidebar/Sidebar";
import Navbar from "../components/Navbar/Navbar";
import styles from "./DashboardLayout.module.css";

function DashboardLayout({ children }) {
  return (
    <div className={styles.container}>
      <Sidebar />

      <div className={styles.main}>
        <Navbar />

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;