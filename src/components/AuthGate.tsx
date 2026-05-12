import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/useAuth";
import { PatientsProvider } from "../store/patientsStore";

export function AuthGate() {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PatientsProvider key={session.mode} mode={session.mode}>
      <Outlet />
    </PatientsProvider>
  );
}
