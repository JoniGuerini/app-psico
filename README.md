# app-psico

Aplicativo simples (single-file HTML) para gerenciamento de pacientes, voltado a psicólogos. Cadastro, busca, agenda semanal recorrente e visão geral em um único arquivo `cadastro-pacientes.html`. Os dados são persistidos no `localStorage` do navegador.

## Como rodar

Não precisa de servidor nem build. Basta abrir o arquivo no navegador:

```bash
open cadastro-pacientes.html
```

Ou rodar um servidor estático (opcional, se quiser usar a URL):

```bash
python3 -m http.server 8080
# depois acesse http://localhost:8080/cadastro-pacientes.html
```

## Funcionalidades

- **Início (dashboard)**: saudação, atendimentos do dia, stats da semana, atalhos e cadastros recentes.
- **Cadastro de paciente**: dados pessoais, endereço (com auto-preenchimento via [ViaCEP](https://viacep.com.br/)), contato, valores, modalidade (Presencial/Remoto/Híbrido) e agendamentos recorrentes.
- **Lista**: busca por nome/CPF/e-mail, filtros por status e tipo, edição inline e exclusão.
- **Agenda**: visualização semanal de todos os atendimentos recorrentes.
- **Perfil**: visão completa e edição inline.

## Dados mockados

Na primeira abertura, o app gera 25 pacientes fictícios para demonstração. Para resetar:

```js
localStorage.removeItem("mock_seeded_v1");
localStorage.removeItem("pacientes_v1");
location.reload();
```

## Stack

HTML + CSS + JavaScript puros, sem dependências de build. Usa as fontes Manrope e Fraunces via Google Fonts.
