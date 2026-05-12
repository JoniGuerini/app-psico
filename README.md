# Lume

**Sua clínica em foco.** Plataforma web de gestão clínica para psicólogos — cadastro de pacientes, agenda semanal recorrente, pagamentos por sessão e dashboard em um SPA. Os dados são persistidos no `localStorage` do navegador.

> Migrado de um único arquivo HTML (legado preservado no histórico do Git) para **React + Vite + TypeScript**.

## Stack

- **React 19** + **TypeScript** + **Vite 8**
- **React Router** para navegação (URLs reais por rota)
- **CSS global** (sem framework) — paleta creme / azul / verde, fontes Manrope + Fraunces
- `localStorage` como storage local (chave `pacientes_v1`)

## Como rodar localmente

```bash
npm install
npm run dev
```

Abrirá em `http://localhost:5173/`.

### Scripts

| Comando            | Descrição                                    |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Inicia o servidor de desenvolvimento (Vite)  |
| `npm run build`    | Type-check + build de produção em `dist/`    |
| `npm run preview`  | Pré-visualiza o build de produção            |
| `npm run lint`     | Roda o ESLint                                |

## Estrutura

```
src/
├── App.tsx                  # Router setup
├── main.tsx                 # Entry point
├── styles/
│   └── global.css           # Estilos globais (paleta + componentes)
├── types/
│   └── patient.ts           # Tipos Paciente, Agendamento, etc.
├── lib/
│   ├── constants.ts         # DIAS_SEMANA, DURACOES, SLOT_*, storage keys
│   ├── format.ts            # Máscaras de CPF/CEP/telefone/moeda + utils
│   ├── time.ts              # Conversões HH:mm ↔ minutos ↔ slot index
│   ├── validation.ts        # validateCPF, validateEmail
│   ├── viacep.ts            # Wrapper da API ViaCEP
│   └── seed.ts              # Geração de 25 pacientes mockados
├── store/
│   ├── patientsContext.ts   # Context type
│   ├── patientsStore.tsx    # PatientsProvider
│   └── usePatients.ts       # Hook usePatients
├── components/
│   ├── Layout.tsx           # Header + nav + <Outlet />
│   ├── Toast.tsx            # ToastProvider
│   ├── useToast.ts          # Hook useToast
│   ├── toastContext.ts      # Toast context type
│   ├── ConfirmDialog.tsx
│   └── PatientForm.tsx      # Formulário (modo create/edit)
└── pages/
    ├── HomePage.tsx         # Dashboard
    ├── PatientsListPage.tsx # Lista + busca + filtros
    ├── CreatePatientPage.tsx
    ├── CalendarPage.tsx     # Agenda semanal em grade
    └── ProfilePage.tsx      # Visualização + edição inline
```

## Rotas

| URL                          | Página                       |
| ---------------------------- | ---------------------------- |
| `/`                          | Dashboard                    |
| `/pacientes`                 | Lista                        |
| `/pacientes/novo`            | Novo cadastro                |
| `/pacientes/:id`             | Perfil (visualização)        |
| `/pacientes/:id/editar`      | Perfil (edição inline)       |
| `/agenda`                    | Grade semanal                |

## Funcionalidades

- **Dashboard**: saudação dinâmica, atendimentos do dia, stats da semana, atalhos e cadastros recentes.
- **Cadastro**: dados pessoais, endereço (auto-preenchido via ViaCEP), contato, valores, modalidade (Presencial / Remoto / Híbrido) e agendamentos recorrentes.
- **Lista**: busca por nome / CPF / e-mail, filtros por status e tipo.
- **Agenda**: grade semanal de 07:00 às 22:00 em slots de 30min, com eventos posicionados por dia × horário.
- **Perfil**: visão completa do paciente, edição inline, exclusão e toggle de status.

## Dados mockados

Na primeira abertura, o app gera 25 pacientes fictícios para demonstração. Para resetar:

```js
localStorage.removeItem("mock_seeded_v1");
localStorage.removeItem("pacientes_v1");
location.reload();
```

## Deploy

App SPA puro. Em hosts como **Vercel**, **Netlify** ou **Cloudflare Pages**:

- **Build command**: `npm run build`
- **Output directory**: `dist`
- Configure um rewrite/fallback de todas as rotas para `index.html` (necessário pelo React Router).

No Vercel um `vercel.json` mínimo resolve:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
