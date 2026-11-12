import { DangerZone, IncidentReport, NavigationRoute } from '../types';

export const INITIAL_DANGER_ZONES: DangerZone[] = [
  {
    id: 'zone-1',
    name: 'Região Santa Ifigênia & Luz',
    neighborhood: 'República / Santa Ifigênia',
    city: 'São Paulo',
    riskLevel: 'critico',
    coordinates: [-23.5375, -46.6372],
    radiusMeters: 450,
    primaryRisk: 'furto_celular',
    title: 'Área com alto índice de furto e arrastão de smartphone',
    description: 'Incidência recorrente de aproximação por bicicletas e grupos em semáforos e esquinas movimentadas.',
    defenseCivilTip: 'Mantenha os vidros do veículo 100% fechados. Evite fixar o celular no suporte do painel ou saídas de ar condicionado próximas à janela.',
    safeAlternativeAdvice: 'Sugerimos contorno via Av. São João e Elevado Pres. João Goulart ou Corredor 23 de Maio.',
    recentIncidentsCount: 42,
    source: 'Defesa Civil SP'
  },
  {
    id: 'zone-2',
    name: 'Praça da Sé & Parque Dom Pedro',
    neighborhood: 'Sé',
    city: 'São Paulo',
    riskLevel: 'alto',
    coordinates: [-23.5505, -46.6333],
    radiusMeters: 500,
    primaryRisk: 'furto_celular',
    title: 'Atenção redobrada: Área de furto oportunista',
    description: 'Ponto com fluxo intenso de pedestres e relatos de "puxão" de celular em carros parados no trânsito.',
    defenseCivilTip: 'Trave todas as portas. Não manuseie o celular enquanto aguarda abertura do semáforo. Prefira comandos por voz via Bluetooth.',
    safeAlternativeAdvice: 'Desvio disponível pela Ligação Leste-Oeste ou Viaduto do Chá com monitoramento policial ativo.',
    recentIncidentsCount: 31,
    source: 'SSP-SP'
  },
  {
    id: 'zone-3',
    name: 'Radial Leste - Viaduto Bresser',
    neighborhood: 'Brás',
    city: 'São Paulo',
    riskLevel: 'alto',
    coordinates: [-23.5432, -46.6087],
    radiusMeters: 380,
    primaryRisk: 'arrastao',
    title: 'Alerta de congestionamento com risco de abordagem',
    description: 'Histórico de arrastões pontuais no início da noite nos horários de pico entre 18h e 20h30.',
    defenseCivilTip: 'Mantenha distância de segurança do carro da frente para manobras de escape se necessário. Vidros escurecidos e trancados.',
    safeAlternativeAdvice: 'Utilize a Av. Alcântara Machado pelas faixas centrais ou contorne pela Rua da Mooca.',
    recentIncidentsCount: 19,
    source: 'CitizenTech Rede'
  },
  {
    id: 'zone-4',
    name: 'Baixada do Glicério / Tamanduateí',
    neighborhood: 'Liberdade / Glicério',
    city: 'São Paulo',
    riskLevel: 'critico',
    coordinates: [-23.5562, -46.6278],
    radiusMeters: 400,
    primaryRisk: 'alagamento',
    title: 'Risco iminente de alagamento e ponto cego de segurança',
    description: 'Alagamentos rápidos em chuvas de verão e baixa visibilidade noturna com iluminação precária.',
    defenseCivilTip: 'Em caso de chuva forte, NUNCA atravesse vias com água acima da metade da roda. Busque rotas em elevação na Liberdade.',
    safeAlternativeAdvice: 'Desvio seguro e elevado pela Av. Brigadeiro Luís Antônio ou Rua Vergueiro.',
    recentIncidentsCount: 14,
    source: 'Defesa Civil SP'
  },
  {
    id: 'zone-5',
    name: 'Cruzamento Av. Paulista x Rua da Consolação',
    neighborhood: 'Bela Vista / Consolação',
    city: 'São Paulo',
    riskLevel: 'moderado',
    coordinates: [-23.5587, -46.6601],
    radiusMeters: 300,
    primaryRisk: 'furto_celular',
    title: 'Gangue da Bicicleta - Furto relâmpago de smartphones',
    description: 'Ciclistas em alta velocidade que quebram vidros ou tomam celulares das mãos de passageiros.',
    defenseCivilTip: 'Se estiver no banco do passageiro ou transporte por aplicativo, guarde o telefone na bolsa durante a parada no semáforo.',
    safeAlternativeAdvice: 'Permanecer nas faixas centrais da Paulista ou desviar pela Alameda Santos.',
    recentIncidentsCount: 27,
    source: 'SSP-SP'
  },
  {
    id: 'zone-capao-redondo',
    name: 'Região Capão Redondo & Estrada de Itapecerica',
    neighborhood: 'Capão Redondo',
    city: 'São Paulo',
    riskLevel: 'critico',
    coordinates: [-23.6698, -46.7795],
    radiusMeters: 700,
    primaryRisk: 'assalto',
    title: 'Alerta Máximo: Capão Redondo — Alto índice de roubos e abordagens',
    description: 'Trechos de lentidão próximos ao metrô Capão Redondo, Estrada de Itapecerica e Av. Carlos Caldeira Filho com registro frequente de abordagens.',
    defenseCivilTip: 'Mantenha vidros 100% fechados e portas travadas. Evite celular aceso em suportes no painel perto do vidro; utilize apenas áudio do GPS.',
    safeAlternativeAdvice: 'Prefira corredores principais iluminados como a Av. Giovanni Gronchi ou Marginal Pinheiros em horários críticos.',
    recentIncidentsCount: 38,
    source: 'Defesa Civil SP'
  }
];

export const INITIAL_INCIDENT_REPORTS: IncidentReport[] = [
  {
    id: 'inc-101',
    title: 'Furto de celular por dupla em bicicleta',
    category: 'furto_celular',
    description: 'Vidro estava aberto 3 dedos no semáforo da Rua Gusmões. Dupla passou de bike e puxou o aparelho no suporte.',
    neighborhood: 'Santa Ifigênia',
    address: 'Rua dos Gusmões x Av. Rio Branco',
    coordinates: [-23.5381, -46.6385],
    riskLevel: 'critico',
    timestamp: 'Hoje, às 19:42',
    status: 'ativo',
    confirmationsCount: 18,
    reportedBy: 'Motorista de App (Marcelo S.)',
    isUserCreated: false
  },
  {
    id: 'inc-102',
    title: 'Tentativa de abordagem em semáforo fechado',
    category: 'assalto',
    description: 'Dois indivíduos bateram no vidro do carro exigindo celular. Conseguimos acelerar após sinal abrir.',
    neighborhood: 'República',
    address: 'Av. Ipiranga, 890',
    coordinates: [-23.5429, -46.6433],
    riskLevel: 'alto',
    timestamp: 'Hoje, às 18:15',
    status: 'ativo',
    confirmationsCount: 12,
    reportedBy: 'Cidadão Verificado',
    isUserCreated: false
  },
  {
    id: 'inc-103',
    title: 'Iluminação pública completamente apagada',
    category: 'iluminacao_precaria',
    description: 'Postes apagados há 3 dias nesta extensão. Rua muito deserta após as 20h.',
    neighborhood: 'Sé',
    address: 'Rua Tabatinguera, 150',
    coordinates: [-23.5521, -46.6301],
    riskLevel: 'moderado',
    timestamp: 'Ontem, às 21:05',
    status: 'em_verificacao',
    confirmationsCount: 9,
    reportedBy: 'Morador Local (Camila T.)',
    isUserCreated: false
  },
  {
    id: 'inc-104',
    title: 'Ponto com acúmulo de água sob o viaduto',
    category: 'alagamento',
    description: 'Boca de lobo entupida com água atingindo calçada. Risco de pane elétrica em veículos baixos.',
    neighborhood: 'Brás',
    address: 'Baixo do Viaduto Alcântara Machado',
    coordinates: [-23.5441, -46.6112],
    riskLevel: 'alto',
    timestamp: 'Hoje, às 16:30',
    status: 'resolvido',
    confirmationsCount: 15,
    reportedBy: 'Defesa Civil Monitoramento',
    isUserCreated: false
  },
  {
    id: 'inc-105',
    title: 'Alerta crítico: abordagem a motoristas parados no semáforo',
    category: 'assalto',
    description: 'Registros recorrentes de abordagem rápida próximo a cruzamentos da Estrada de Itapecerica e Estação Capão Redondo nos horários de pico.',
    neighborhood: 'Capão Redondo',
    address: 'Estrada de Itapecerica x Av. Carlos Caldeira Filho',
    coordinates: [-23.6698, -46.7795],
    riskLevel: 'critico',
    timestamp: 'Hoje, às 20:10',
    status: 'ativo',
    confirmationsCount: 24,
    reportedBy: 'Rede CitizenTech Zona Sul',
    isUserCreated: false
  }
];

export const PRESET_ROUTES: NavigationRoute[] = [
  {
    id: 'route-fast',
    name: 'Rota Mais Rápida (Convencional)',
    type: 'rapida',
    distanceKm: 7.2,
    durationMin: 18,
    baseDurationMin: 18,
    safetyScore: 42,
    dangerZoneIds: ['zone-1', 'zone-2'],
    description: 'Corta o Centro Histórico via Santa Ifigênia e Praça da Sé. Menor tempo estimado, mas atravessa 2 áreas com alto índice de furto.',
    highlights: [
      'Menor tempo de tráfego (-4 min)',
      'Cruza 2 zonas com alto índice de furto de celular',
      'Recomendação: Ativar vidros fechados e travas'
    ],
    // Coordinates path starting around Paulista / Consolação down towards Santa Ifigênia, Sé, and ending at Brás
    path: [
      [-23.5587, -46.6601],
      [-23.5525, -46.6515],
      [-23.5460, -46.6450],
      [-23.5398, -46.6395], // Zone 1 trigger
      [-23.5375, -46.6372], // In Zone 1
      [-23.5440, -46.6350],
      [-23.5505, -46.6333], // Zone 2 trigger
      [-23.5480, -46.6210],
      [-23.5432, -46.6087]  // Destination Brás
    ]
  },
  {
    id: 'route-safe',
    name: 'SafeRoute (Desvio Recomendado)',
    type: 'segura',
    distanceKm: 8.4,
    durationMin: 22,
    baseDurationMin: 22,
    safetyScore: 94,
    dangerZoneIds: [],
    description: 'Evita áreas críticas contornando por avenidas monitoradas com câmeras do Detecta SP, iluminação LED e presença policial.',
    highlights: [
      'Livre de zonas críticas de furto de smartphone',
      'Corredor monitorado Smart Sampa com iluminação LED',
      'Apenas +4 minutos para máxima segurança'
    ],
    path: [
      [-23.5587, -46.6601],
      [-23.5650, -46.6520], // Desvia pela Paulista / 23 de Maio
      [-23.5680, -46.6430],
      [-23.5620, -46.6350],
      [-23.5550, -46.6200],
      [-23.5470, -46.6120],
      [-23.5432, -46.6087]  // Chegada segura no Brás
    ]
  },
  {
    id: 'route-alternative',
    name: 'Rota Alternativa (Elevado & Vias Expressas)',
    type: 'alternativa',
    distanceKm: 7.9,
    durationMin: 20,
    baseDurationMin: 20,
    safetyScore: 78,
    dangerZoneIds: [],
    description: 'Passa por viadutos expressos mantendo velocidade contínua sem paradas em semáforos vulneráveis.',
    highlights: [
      'Menos paradas em semáforos vulneráveis',
      'Fluxo contínuo em via expressa',
      'Índice de segurança favorável (78/100)'
    ],
    path: [
      [-23.5587, -46.6601],
      [-23.5490, -46.6570],
      [-23.5390, -46.6500],
      [-23.5310, -46.6350],
      [-23.5350, -46.6200],
      [-23.5432, -46.6087]
    ]
  }
];

export const DEFESA_CIVIL_SAFETY_GUIDES = [
  {
    id: 'guide-1',
    title: 'Protocolo de Prevenção: Gangue do Celular e Trânsito',
    category: 'furto_celular',
    badge: 'Prioridade Alta',
    tips: [
      'Insulfilm e Vidros: mantenha os vidros totalmente fechados em pontos de lentidão, cruzamentos e noites.',
      'Celular no Suporte: evite deixar a tela acesa em suportes no painel perto do vidro; prefira áudio do GPS ou deixe abaixo da linha do painel.',
      'Atenção em Cruzamentos: abordagens rápidas ocorrem a pé ou de bicicleta/moto quebrando o vidro do passageiro com o carro parado no semáforo.',
      'Configure comando de voz (Siri / Google Assistente) e mantenha brilho reduzido à noite.'
    ]
  },
  {
    id: 'guide-2',
    title: 'Prevenção de Abordagem em Congestionamentos',
    category: 'assalto',
    badge: 'Defesa Civil SP',
    tips: [
      'Mantenha sempre espaço livre para ver os pneus traseiros do carro à frente.',
      'Tranque automaticamente as quatro portas logo ao dar a partida.',
      'Bolsas, mochilas e sacolas devem ficar sempre no assoalho ou porta-malas.',
      'Em caso de atitude suspeita, buzine insistentemente para chamar atenção de pedestres e policiais.'
    ]
  },
  {
    id: 'guide-3',
    title: 'Alerta Hidrológico: Pontos de Alagamento Críticos',
    category: 'alagamento',
    badge: 'SMS 40199 Defesa Civil',
    tips: [
      'Evite trafegar sob viadutos na Marginal Tietê e Tamanduateí durante tempestades.',
      'Se o nível da água atingir o meio da roda, mude de direção imediatamente.',
      'Cadastre seu CEP enviando SMS gratuito para o número 40199 da Defesa Civil.',
      'Use a SafeRoute com o filtro de rotas elevadas ativado durante alertas climáticos.'
    ]
  }
];
