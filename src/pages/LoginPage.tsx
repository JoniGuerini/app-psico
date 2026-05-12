import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../store/useAuth";
import type { SessionMode } from "../lib/auth";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const enter = (mode: SessionMode) => {
    signIn(mode);
    navigate("/", { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />

      <main className="login-card" role="main">
        <div className="login-brand">
          <Logo size={56} className="login-logo" title="Lume" />
          <h1>Lume</h1>
          <p>Sua clínica em foco</p>
        </div>

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
          }}
          aria-label="Entrar na conta"
        >
          <label className="login-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="voce@suaclinica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="login-field">
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <div className="login-actions">
            <button
              type="submit"
              className="login-submit"
              disabled
              title="Autenticação em breve"
            >
              Entrar
            </button>
            <p className="login-soon">
              Autenticação por email chega em breve. Por enquanto, explore com
              um dos modos abaixo.
            </p>
          </div>
        </form>

        <div className="login-divider" role="separator">
          <span>ou explore agora</span>
        </div>

        <div className="login-modes">
          <button
            type="button"
            className="login-mode login-mode-demo"
            onClick={() => enter("mock")}
          >
            <span className="login-mode-text">
              <strong>Entrar com dados de demonstração</strong>
              <small>
                Pacientes, agenda e pagamentos prontos pra testar o app.
              </small>
            </span>
          </button>

          <button
            type="button"
            className="login-mode login-mode-guest"
            onClick={() => enter("guest")}
          >
            <span className="login-mode-text">
              <strong>Entrar como convidado</strong>
              <small>Workspace vazio. Comece do zero, à sua maneira.</small>
            </span>
          </button>
        </div>

        <footer className="login-foot">
          Versão demo · Os dois modos guardam tudo no seu navegador.
        </footer>
      </main>
    </div>
  );
}
