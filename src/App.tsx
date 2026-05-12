import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthGate } from "./components/AuthGate";
import { ScrollToTop } from "./components/ScrollToTop";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./store/authStore";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { PatientsListPage } from "./pages/PatientsListPage";
import { CreatePatientPage } from "./pages/CreatePatientPage";
import { CalendarPage } from "./pages/CalendarPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PendingPaymentsPage } from "./pages/PendingPaymentsPage";
import { RecentPatientsPage } from "./pages/RecentPatientsPage";
import { FinancialDashboardPage } from "./pages/FinancialDashboardPage";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AuthGate />}>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="/pacientes" element={<PatientsListPage />} />
                <Route
                  path="/pacientes/recentes"
                  element={<RecentPatientsPage />}
                />
                <Route path="/pacientes/novo" element={<CreatePatientPage />} />
                <Route path="/pacientes/:id" element={<ProfilePage />} />
                <Route path="/pacientes/:id/editar" element={<ProfilePage />} />
                <Route path="/agenda" element={<CalendarPage />} />
                <Route path="/financeiro" element={<FinancialDashboardPage />} />
                <Route
                  path="/pagamentos/pendentes"
                  element={<PendingPaymentsPage />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
