# SafeRoute &bull; CitizenTech São Paulo 🛡️🚗

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=for-the-badge)](LICENSE)

> **Front-end Design & Web Development (Interface & Interação)**  
> **Responsável Técnica:** Nicolly (Tech Lead)  
> **Repositório Oficial:** [github.com/ninixzzs/saferoute-citizentech](https://github.com/ninixzzs/saferoute-citizentech)  

---

## 💡 A Ideia do Projeto

Sabe quando a gente vai para um lugar novo em São Paulo e fica meio perdido sem saber se a rua é perigosa ou se tem risco de furto?

A nossa proposta no **SafeRoute CitizenTech** é adaptar a lógica consagrada dos **alertas da Defesa Civil** (como aqueles SMS 40199 enviados antes de tempestades severas) diretamente para a navegação urbana estilo **Waze / Google Maps**.

### Como funciona na prática?
1. **Traçado de Rota Inteligente:** Ao traçar uma rota em direção a um bairro desconhecido (ex: Sé, Santa Ifigênia, República, Brás ou Baixada do Glicério), o sistema calcula a rota convencional e uma **SafeRoute** (desvio seguro).
2. **Geofencing & Alerta na Tela:** Quando o veículo entra em uma área crítica catalogada (mancha de criminalidade ou risco hidrológico), o app dispara um alerta em destaque estilo Defesa Civil.
3. **Dicas Práticas Imediatas:** *"Área com alto índice de furto de smartphone. Mantenha os vidros 100% fechados e evite o aparelho fixado no suporte visível."*
4. **Desvio Imediato (+4 min):** Sugestão de desvio automático por corredores monitorados por câmeras do Detecta SP / Smart Sampa com iluminação de LED e presença policial.
5. **Avisos Sonoros e por Voz:** Síntese de voz em português (Web Speech API) e sirene acústica simulada (Web Audio API).
6. **Rede Colaborativa CitizenTech (CRUD Completo):** Os próprios cidadãos e motoristas podem reportar novas ocorrências, confirmar relatos da comunidade e marcar alertas como resolvidos.

---

## 🧩 Funcionalidades Implementadas

- [x] **Aplicação Web em React 19 + Vite + Tailwind CSS v4**
- [x] **12 Componentes Reutilizáveis & Modulares**
  - `Navbar`, `AlertBanner`, `DefesaCivilModal`, `NavigationMap`, `RouteSelector`, `NavigationControls`, `IncidentList`, `IncidentReportModal`, `SafetyTipsDrawer`, `SafetyScoreBadge`, `StatsOverview`, `Footer`.
- [x] **4 Custom Hooks Especializados (com `useState` e `useEffect`)**
  - `useSafetyAlerts` (gerenciamento de incidentes, zonas e CRUD)
  - `useRouteNavigation` (simulação de GPS, velocidade e navegação passo a passo)
  - `useGeofenceAlert` (cálculo geográfico e gatilho de transmissão)
  - `useVoiceGuidance` (locução em pt-BR e áudio Web Audio API)
- [x] **CRUD Completo com API Externa REST**
  - **Create:** Registro de novo alerta de perigo (POST)
  - **Read:** Visualização com filtros avançados e busca textual (GET)
  - **Update:** Edição de status para "resolvido" e confirmação de votos (PATCH)
  - **Delete:** Exclusão de alertas falsos ou expirados (DELETE)
- [x] **Mapa Interativo com OpenStreetMap / CartoDB Dark Matter**
- [x] **Simulador de Direção GPS em Tempo Real com Velocímetro Digital**
- [x] **Gaveta de Protocolos da Defesa Civil & Telefones de Emergência (190, 199, 153, 181)**
- [x] **Configurações Prontas para Deploy (Vercel, Netlify e GitHub Actions)**
- [x] **Arquivo `AI.md` detalhado na raiz**
- [x] **Mais de 15 Commits Significativos no Git**

---

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js 18+ instalado
- npm ou pnpm

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/ninixzzs/saferoute-citizentech.git

# 2. Acesse a pasta do projeto
cd saferoute-citizentech

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev

# 5. Para testar o build de produção:
npm run build
npm run preview
```

Abra seu navegador em `http://localhost:3000`.

---

## 🌐 Deploy Ativo

A aplicação está pronta para ser publicada com 1 clique:
- **Vercel:** Importe o repositório no dashboard da Vercel (o arquivo `vercel.json` cuidará de tudo).
- **Netlify:** Conecte o repositório no Netlify (configurado via `netlify.toml`).
- **GitHub Pages:** O workflow automatizado em `.github/workflows/deploy.yml` compila e faz deploy no branch `gh-pages` a cada push no repositório.

---

## 👩‍💻 Equipe & Liderança

- **Nicolly (Tech Lead)** &bull; *Front-end Design & Web Development (Interface & Interação)*
- **GitHub:** [ninixzzs](https://github.com/ninixzzs)

---

## 📄 Licença
Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
