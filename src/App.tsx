import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import { ToastProvider } from "./components/Toast";
import { PatientsProvider } from "./store/patientsStore";
import { HomePage } from "./pages/HomePage";
import { PatientsListPage } from "./pages/PatientsListPage";
import { CreatePatientPage } from "./pages/CreatePatientPage";
import { CalendarPage } from "./pages/CalendarPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PendingPaymentsPage } from "./pages/PendingPaymentsPage";
import { RecentPatientsPage } from "./pages/RecentPatientsPage";

export default function App() {
  return (
    <PatientsProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/pacientes" element={<PatientsListPage />} />
              <Route path="/pacientes/recentes" element={<RecentPatientsPage />} />
              <Route path="/pacientes/novo" element={<CreatePatientPage />} />
              <Route path="/pacientes/:id" element={<ProfilePage />} />
              <Route path="/pacientes/:id/editar" element={<ProfilePage />} />
              <Route path="/agenda" element={<CalendarPage />} />
              <Route
                path="/pagamentos/pendentes"
                element={<PendingPaymentsPage />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </PatientsProvider>
  );
}
