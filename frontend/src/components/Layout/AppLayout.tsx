import { useNavigate } from "react-router-dom";
import Sidebar from "../Dashboard/Sidebar/Sidebar";
import Topbar from "../Dashboard/Topbar/Topbar";
import { getCurrentUser, clearSession } from "../../lib/auth";
import styles from "./AppLayout.module.css";

export default function AppLayout({ title, subtitle, actions, children }) {
  const user = getCurrentUser();
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div className={styles.shell}>
      <Sidebar user={user} onLogout={handleLogout} />

      <main className={styles.main}>
        <Topbar user={user} />

        {(title || actions) && (
          <div className={styles.pageHeader}>
            <div>
              {title && <h1>{title}</h1>}
              {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && <div className={styles.pageActions}>{actions}</div>}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
