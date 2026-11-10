# AI.md &bull; Documentação de Engenharia com IA & Decisões Arquiteturais

> **Projeto**: SafeRoute SP &bull; CitizenTech  
> **Repositório**: [ninixzzs/saferoute-citizentech](https://github.com/ninixzzs/saferoute-citizentech)  
> **Liderança Técnica (Tech Lead)**: Nicolly  
> **Módulo**: Front-end Design & Web Development (Interface & Interação)  
> **Data**: Novembro de 2026  

---

## 1. Visão do Produto & Problema Urbano

### O Desafio
Em grandes metrópoles como São Paulo, condutores e passageiros frequentemente navegam por bairros e ruas desconhecidas sem consciência prévia de vulnerabilidades criminais específicas do local — como áreas com alta incidência de furto de smartphone por ciclistas ("gangue da bike"), semáforos com risco de puxão através de janelas semiabertas, pontos de alagamento sob viadutos ou áreas desertas após o anoitecer.

### A Solução SafeRoute
Inspirada diretamente na mecânica dos **alertas de emergência da Defesa Civil** (como os tradicionais comunicados via SMS 40199 e transmissões celulares de tempestade), a SafeRoute integra essa mesma inteligência em tempo real a uma interface de navegação GPS urbana (estilo Waze / Google Maps).

Quando o usuário traça uma rota e o veículo se aproxima ou entra em uma área crítica catalogada (ex: Santa Ifigênia, Sé, Radial Leste ou Baixada do Glicério):
1. **Alerta Visual Emergencial (Banner & Modal estilo Defesa Civil)**: Notificação de alta visibilidade informando a natureza do perigo.
2. **Dicas Práticas Imediatas**: Instruções objetivas de sobrevivência urbana (*ex: "Vidros fechados, evite suporte de celular fixado perto da janela, trave portas"*).
3. **Sugestão de Desvio Mais Seguro**: Recálculo com 1 clique para uma rota monitorada (ex: vias com câmeras Smart Sampa, iluminação LED e presença policial), adicionando apenas alguns minutos para máxima segurança.
4. **Alerta Sonoro & Por Voz**: Avisos sintetizados via Web Speech API e sinal acústico de emergência via Web Audio API.
5. **Rede Colaborativa CitizenTech (CRUD)**: Possibilidade de qualquer cidadão reportar novas ocorrências, confirmar veracidade de alertas comunitários e acompanhar o status de resolução.

---

## 2. Processo de Co-Criação com Inteligência Artificial

O desenvolvimento foi conduzido em estreita colaboração entre a Tech Lead **Nicolly** e o assistente de IA da Google DeepMind, seguindo um fluxo iterativo e rigoroso de engenharia de software:

### 2.1. Prompts Principais & Iterações

#### Prompt 1: Definição Conceitual e Arquitetura de Domínio
> *"Como Tech Lead, preciso desenhar a aplicação SafeRoute CitizenTech em React com Tailwind CSS v4. A ideia central é aplicar a lógica de alertas da Defesa Civil (SMS de perigo) à navegação urbana em São Paulo, avisando sobre áreas críticas de furto de celular e sugerindo desvios seguros. Quais estruturas de dados e entidades de domínio devemos definir?"*
- **Resultado da IA**: Criação dos tipos `DangerZone`, `IncidentReport`, `NavigationRoute` e `NavigationState`, com modelo geográfico por raio em metros (geofencing) e coordenadas reais de SP.

#### Prompt 2: Design System e Tailwind CSS v4
> *"Queremos um visual dark-mode de alta tecnologia (centro de comando de segurança cívica), com contraste acessível para alertas de perigo (vermelho carmim e âmbar) e rotas seguras (esmeralda). Como estruturar isso com Tailwind CSS v4 e Leaflet?"*
- **Resultado da IA**: Configuração do `@tailwindcss/vite` com Tailwind v4 `@import "tailwindcss";`, animações personalizadas de radar pulse (`radar-warning`) e siren flash (`emergency-broadcast`), além de estilização escura dos popups do Leaflet com mapa base CartoDB Dark Matter.

#### Prompt 3: Custom Hooks Reutilizáveis
> *"Implemente a lógica de navegação simulada e detecção de geofencing através de Custom Hooks dedicados com useState e useEffect, desacoplando a camada de mapa da camada de estado."*
- **Resultado da IA**: Criação de `useSafetyAlerts`, `useRouteNavigation`, `useGeofenceAlert` e `useVoiceGuidance`.

### 2.2. Design System Minimalista (Preto, Cinza e Branco)
A aplicação adota uma estética sóbria e funcional orientada a produtos de missão crítica e segurança cívica:
- Paleta monocromática de alto contraste (preto puro, cinzas neutros e branco).
- Eliminação de gradientes e efeitos saturados genéricos.
- Mapa com renderização de vias e cruzamentos em alta nitidez (OpenStreetMap).
- Notificações estruturadas no padrão de mensagens nativas de sistema dentro da tela do dispositivo móvel.

---

## 3. Arquitetura de Componentes & Stack

```
saferoute-citizentech/
├── .github/workflows/deploy.yml   # CI/CD automatizado GitHub Actions
├── public/shield-alert.svg        # Favicon e identidade visual
├── src/
│   ├── components/                # 13 componentes reutilizáveis
│   │   ├── AlertBanner.tsx        # Banner de aviso emergencial
│   │   ├── DefesaCivilModal.tsx   # Modal de alerta estilo transmissão 40199
│   │   ├── Footer.tsx             # Rodapé com créditos de Nicolly & repositório
│   │   ├── IncidentList.tsx       # Feed de ocorrências com filtros e ações CRUD
│   │   ├── IncidentReportModal.tsx# Formulário de criação de ocorrências (POST)
│   │   ├── MobilePhoneSimulator.tsx # Protótipo Smartphone tela de celular estilo Google Maps
│   │   ├── Navbar.tsx             # Cabeçalho com status e controles de áudio
│   │   ├── NavigationControls.tsx # Velocímetro, barra de progresso e controles GPS
│   │   ├── NavigationMap.tsx      # Mapa interativo Leaflet com radar e camadas
│   │   ├── RouteSelector.tsx      # Comparador de rotas com Safety Score
│   │   ├── SafetyScoreBadge.tsx   # Badge reutilizável de índice de segurança
│   │   ├── SafetyTipsDrawer.tsx   # Painel lateral com protocolos de proteção
│   │   └── StatsOverview.tsx      # Cartões de métricas da rede
│   ├── data/
│   │   └── mockData.ts            # Zonas reais de SP, rotas e diretrizes
│   ├── hooks/                     # Custom Hooks (useState, useEffect)
│   │   ├── useGeofenceAlert.ts    # Detecção de entrada em raio crítico
│   │   ├── useRouteNavigation.ts  # Simulação passo a passo de condução GPS
│   │   ├── useSafetyAlerts.ts     # Gerenciamento de estado e filtros do CRUD
│   │   └── useVoiceGuidance.ts    # Síntese de voz em pt-BR e tons acústicos
│   ├── services/
│   │   └── api.ts                 # Serviço de CRUD com API externa e Haversine
│   ├── types/
│   │   └── index.ts               # Tipagens TypeScript completas
│   ├── App.tsx                    # Orquestrador principal da aplicação
│   ├── index.css                  # Estilos globais e Tailwind v4
│   └── main.tsx                   # Ponto de montagem React 19
├── AI.md                          # Este documento de decisões de IA
├── package.json                   # Dependências e scripts
├── tsconfig.json                  # Configurações TypeScript
├── vite.config.ts                 # Configuração do Vite e Tailwind v4
├── vercel.json                    # Configuração para Deploy na Vercel
└── netlify.toml                   # Configuração para Deploy na Netlify
```

---

## 4. Detalhamento dos Componentes Reutilizáveis (13)

1. **`MobilePhoneSimulator`**: Chassis fidedigno de smartphone com Dynamic Island, barra de status do sistema (5G, horário, bateria), cabeçalho de navegação estilo Google Maps com manobras passo a passo (*"Em 200m, vire à direita"*), velocímetro com limite de via, bottom sheet com ETA/duração e notificação *Heads-Up* que desce do topo ao cruzar área crítica de perigo com botão de desvio instantâneo.
2. **`SafetyScoreBadge`**: Exibe a pontuação de 0 a 100 de uma rota ou área com cores dinâmicas (verde >80, amarelo 55-79, vermelho <55) e ícone contextual.
3. **`Navbar`**: Barra de navegação com status da rede SSP/Defesa Civil, contador de alertas ativos, toggle de voz e atalhos rápidos.
4. **`AlertBanner`**: Alerta superior fixo que dispara quando o condutor ingressa em zona perigosa, oferecendo botão de desvio instantâneo.
5. **`DefesaCivilModal`**: Modal imersivo simulando aviso de transmissão de emergência (SMS 40199), com instruções táticas e opção de aceite de desvio.
6. **`NavigationMap`**: Container Leaflet com azulejos Dark Matter CartoDB, traçado de polilinhas seguras vs perigosas, círculos com efeito radar nas manchas criminais e marcador do veículo em deslocamento contínuo (navigation puck com cone de direção).
7. **`RouteSelector`**: Seletor comparativo entre "Rota Rápida", "SafeRoute Defesa Civil" e "Rota Expressa", demonstrando tempo, distância e pontuação de segurança.
8. **`NavigationControls`**: Cockpit de direção com velocímetro digital em tempo real (km/h), barra de progresso e botões de simulação (Iniciar, Pausar, Retomar, Reiniciar).
9. **`IncidentList`**: Painel de visualização e gerenciamento das ocorrências (Read, Update status para "resolvido", Delete e Upvote com confirmações da comunidade).
10. **`IncidentReportModal`**: Formulário modal acessível para registro de novas ocorrências (Create), com seleção de bairro e coordenadas geográficas de SP.
11. **`SafetyTipsDrawer`**: Gaveta lateral expansível com telefones de emergência (190, 199, 153, 181) e diretrizes contra a "gangue da bicicleta".
12. **`StatsOverview`**: Indicadores executivos com total de zonas críticas, ocorrências nas últimas 24h, taxa de eficácia de desvio e tamanho da rede cívica.
13. **`Footer`**: Rodapé institucional destacando a liderança de Nicolly, stack utilizada e link para o GitHub oficial.

---

## 5. Implementação dos Custom Hooks

- **`useSafetyAlerts`**:
  - Utiliza `useState` para gerenciar listas de incidentes, zonas de perigo, filtros de busca, categoria e gravidade.
  - Utiliza `useEffect` para carregar dados da API externa ao montar o componente.
  - Encapsula as operações assíncronas do CRUD (`addIncident`, `updateIncident`, `deleteIncident`, `confirmIncident`).

- **`useRouteNavigation`**:
  - Utiliza `useState` para armazenar a rota selecionada, posição atual do carro `[lat, lng]`, velocidade em `km/h` e estado da simulação.
  - Utiliza `useEffect` com `setInterval` para animar o deslocamento da coordenada do veículo ao longo do trajeto traçado.
  - Disponibiliza o método `switchImmediatelyToSafeRoute()` para transição sem atrito para o trajeto seguro.

- **`useGeofenceAlert`**:
  - Calcula a distância euclidiana/Haversine entre a posição atual do veículo e todas as zonas de risco cadastradas.
  - Dispara o evento de alerta assim que a distância for menor ou igual ao `radiusMeters` da localidade.
  - Controla listas de alertas dispensados para evitar notificações repetitivas e garantir uma experiência de direção limpa.

- **`useVoiceGuidance`**:
  - Integra a Web Speech API (`SpeechSynthesisUtterance`) com sotaque nativo `pt-BR`.
  - Gera aviso sonoro de duplo tom (frequências de 880Hz e 659.25Hz) usando a Web Audio API, simulando o apito característico de alertas da Defesa Civil.

---

## 6. Operações de CRUD com API Externa

A persistência foi desenvolvida para operar tanto online quanto offline:
- **CREATE**: Envio de `POST` para `https://jsonplaceholder.typicode.com/posts` com payload da ocorrência; inclusão no array local e salvamento em `localStorage`.
- **READ**: Requisição assíncrona inicial com consolidação entre alertas oficiais da Defesa Civil/SSP e relatos dos usuários.
- **UPDATE**: Envio de `PATCH` para a API externa e atualização do status (`ativo`, `em_verificacao`, `resolvido`) ou incremento das confirmações cívicas.
- **DELETE**: Envio de `DELETE` para a API externa e expurgo imediato do registro na interface e no armazenamento persistido.

---

## 7. Estratégia de Deploy

A aplicação está configurada para deploy contínuo em múltiplos provedores modernos:
- **Vercel**: Configuração completa via `vercel.json` com roteamento SPA.
- **Netlify**: Arquivo `netlify.toml` com comando de build (`npm run build`) e diretório de publicação (`dist`).
- **GitHub Pages**: Workflow automatizado em `.github/workflows/deploy.yml` que compila e publica no branch `gh-pages` a cada push na branch principal.

---

## 8. Considerações Éticas e Segurança Pública

O projeto SafeRoute adota uma postura responsável e orientada à cidadania:
- Não estigmatiza comunidades: foca estritamente em trechos com estatísticas oficiais consolidadas de furto em semáforos e pontos físicos de alagamento.
- Incentiva o uso de rotas alternativas bem iluminadas e monitoradas por órgãos públicos (Programa Smart Sampa e bases comunitárias da PM).
- Promove a autoproteção consciente sem estimular o pânico, capacitando motoristas e passageiros com informações preventivas claras.

---
*Documento elaborado e assinado por **Nicolly (Tech Lead)** em colaboração com Antigravity (Google DeepMind).*
