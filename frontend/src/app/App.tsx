import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { OverviewPage } from "../pages/OverviewPage";
import { ComingSoonPage } from "../pages/ComingSoonPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="calendar" element={<ComingSoonPage kind="calendar" />} />
        <Route path="insights" element={<ComingSoonPage kind="insights" />} />
        <Route path="settings" element={<ComingSoonPage kind="settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
