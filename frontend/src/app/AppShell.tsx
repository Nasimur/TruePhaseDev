import {
  CalendarDays,
  ChartNoAxesCombined,
  Heart,
  House,
  Settings2,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navigation = [
  { to: "/", label: "Overview", icon: House, end: true },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/insights", label: "Insights", icon: ChartNoAxesCombined },
  { to: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <NavLink to="/" className="brand" aria-label="TruePhase home">
          <span className="brand-mark" aria-hidden="true">
            <Heart size={21} strokeWidth={2.2} />
          </span>
          <span>
            True<span className="brand-accent">Phase</span>
          </span>
        </NavLink>

        <div className="sidebar-section-label">YOUR SPACE</div>
        <nav className="sidebar-nav" aria-label="Main menu">
          {navigation.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={"end" in rest ? rest.end : false}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="privacy-symbol" aria-hidden="true">
            <Heart size={17} />
          </div>
          <p>A little more understanding, every day.</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="mobile-header">
          <NavLink to="/" className="brand" aria-label="TruePhase home">
            <span className="brand-mark" aria-hidden="true">
              <Heart size={18} strokeWidth={2.2} />
            </span>
            <span>
              True<span className="brand-accent">Phase</span>
            </span>
          </NavLink>
        </header>
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <nav className="mobile-nav" aria-label="Main menu">
          {navigation.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={"end" in rest ? rest.end : false}
              className={({ isActive }) =>
                `mobile-nav-link${isActive ? " active" : ""}`
              }
            >
              <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
