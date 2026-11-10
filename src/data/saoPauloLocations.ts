export type SaoPauloZone =
  | 'Centro'
  | 'Zona Sul'
  | 'Zona Oeste'
  | 'Zona Leste'
  | 'Zona Norte'
  | 'Marginais e Pontes';

export interface SaoPauloLocationEntry {
  name: string;
  zone: SaoPauloZone;
  kind: 'bairro' | 'via';
  coordinates: [number, number];
}

export const SAO_PAULO_LOCATIONS: SaoPauloLocationEntry[] = [
  // Zona Centro
  { name: 'Sé', zone: 'Centro', kind: 'bairro', coordinates: [-23.5505, -46.6333] },
  { name: 'República', zone: 'Centro', kind: 'bairro', coordinates: [-23.5435, -46.6433] },
  { name: 'Luz', zone: 'Centro', kind: 'bairro', coordinates: [-23.5345, -46.6337] },
  { name: 'Campos Elíseos', zone: 'Centro', kind: 'bairro', coordinates: [-23.5340, -46.6458] },
  { name: 'Consolação', zone: 'Centro', kind: 'bairro', coordinates: [-23.5535, -46.6590] },
  { name: 'Bela Vista', zone: 'Centro', kind: 'bairro', coordinates: [-23.5587, -46.6525] },
  { name: 'Bom Retiro', zone: 'Centro', kind: 'bairro', coordinates: [-23.5282, -46.6384] },
  { name: 'Liberdade', zone: 'Centro', kind: 'bairro', coordinates: [-23.5552, -46.6358] },
  { name: 'Brás', zone: 'Centro', kind: 'bairro', coordinates: [-23.5432, -46.6087] },
  { name: 'Santa Ifigênia', zone: 'Centro', kind: 'bairro', coordinates: [-23.5375, -46.6372] },
  { name: 'Avenida Paulista', zone: 'Centro', kind: 'via', coordinates: [-23.5654, -46.6517] },
  { name: 'Avenida Rangel Pestana', zone: 'Centro', kind: 'via', coordinates: [-23.5476, -46.6258] },
  { name: 'Avenida do Estado', zone: 'Centro', kind: 'via', coordinates: [-23.5446, -46.6272] },
  { name: 'Avenida Rio Branco', zone: 'Centro', kind: 'via', coordinates: [-23.5372, -46.6412] },
  { name: 'Avenida Duque de Caxias', zone: 'Centro', kind: 'via', coordinates: [-23.5364, -46.6448] },
  { name: 'Avenida São João', zone: 'Centro', kind: 'via', coordinates: [-23.5416, -46.6408] },
  { name: 'Avenida Ipiranga', zone: 'Centro', kind: 'via', coordinates: [-23.5429, -46.6433] },
  { name: 'Rua da Consolação', zone: 'Centro', kind: 'via', coordinates: [-23.5535, -46.6584] },
  { name: 'Rua Augusta', zone: 'Centro', kind: 'via', coordinates: [-23.5542, -46.6579] },
  { name: 'Viaduto do Chá / Viaduto Santa Ifigênia', zone: 'Centro', kind: 'via', coordinates: [-23.5448, -46.6368] },

  // Zona Sul
  { name: 'Capão Redondo', zone: 'Zona Sul', kind: 'bairro', coordinates: [-23.6698, -46.7795] },
  { name: 'Campo Limpo', zone: 'Zona Sul', kind: 'bairro', coordinates: [-23.6494, -46.7586] },
  { name: 'Grajaú', zone: 'Zona Sul', kind: 'bairro', coordinates: [-23.7438, -46.6968] },
  { name: 'Vila Mariana', zone: 'Zona Sul', kind: 'bairro', coordinates: [-23.5892, -46.6348] },
  { name: 'Jabaquara', zone: 'Zona Sul', kind: 'bairro', coordinates: [-23.6462, -46.6411] },
  { name: 'Santo Amaro', zone: 'Zona Sul', kind: 'bairro', coordinates: [-23.6545, -46.7097] },
  { name: 'Sacomã', zone: 'Zona Sul', kind: 'bairro', coordinates: [-23.6012, -46.6025] },
  { name: 'Moema', zone: 'Zona Sul', kind: 'bairro', coordinates: [-23.6045, -46.6662] },
  { name: 'Morumbi', zone: 'Zona Sul', kind: 'bairro', coordinates: [-23.6000, -46.7201] },
  { name: 'Avenida Washington Luís', zone: 'Zona Sul', kind: 'via', coordinates: [-23.6261, -46.6564] },
  { name: 'Avenida Engenheiro Luís Carlos Berrini', zone: 'Zona Sul', kind: 'via', coordinates: [-23.6062, -46.6967] },
  { name: 'Avenida Doutor Ricardo Jafet', zone: 'Zona Sul', kind: 'via', coordinates: [-23.5975, -46.6212] },
  { name: 'Avenida Professor Abraão de Morais', zone: 'Zona Sul', kind: 'via', coordinates: [-23.6240, -46.6285] },
  { name: 'Avenida Cupecê', zone: 'Zona Sul', kind: 'via', coordinates: [-23.6660, -46.6632] },
  { name: 'Avenida Rubem Berta', zone: 'Zona Sul', kind: 'via', coordinates: [-23.6050, -46.6512] },
  { name: 'Avenida das Nações Unidas', zone: 'Zona Sul', kind: 'via', coordinates: [-23.6122, -46.6995] },
  { name: 'Avenida Santo Amaro', zone: 'Zona Sul', kind: 'via', coordinates: [-23.6185, -46.6788] },

  // Zona Oeste
  { name: 'Pinheiros', zone: 'Zona Oeste', kind: 'bairro', coordinates: [-23.5673, -46.6934] },
  { name: 'Lapa', zone: 'Zona Oeste', kind: 'bairro', coordinates: [-23.5276, -46.7016] },
  { name: 'Perdizes', zone: 'Zona Oeste', kind: 'bairro', coordinates: [-23.5364, -46.6754] },
  { name: 'Butantã', zone: 'Zona Oeste', kind: 'bairro', coordinates: [-23.5718, -46.7082] },
  { name: 'Vila Leopoldina', zone: 'Zona Oeste', kind: 'bairro', coordinates: [-23.5245, -46.7315] },
  { name: 'Vila Madalena', zone: 'Zona Oeste', kind: 'bairro', coordinates: [-23.5574, -46.6865] },
  { name: 'Itaim Bibi', zone: 'Zona Oeste', kind: 'bairro', coordinates: [-23.5902, -46.6845] },
  { name: 'Avenida Henrique Schaumann', zone: 'Zona Oeste', kind: 'via', coordinates: [-23.5608, -46.6758] },
  { name: 'Avenida Rebouças', zone: 'Zona Oeste', kind: 'via', coordinates: [-23.5642, -46.6710] },
  { name: 'Avenida Doutor Arnaldo', zone: 'Zona Oeste', kind: 'via', coordinates: [-23.5554, -46.6708] },
  { name: 'Avenida Francisco Matarazzo', zone: 'Zona Oeste', kind: 'via', coordinates: [-23.5275, -46.6784] },
  { name: 'Avenida Brigadeiro Faria Lima', zone: 'Zona Oeste', kind: 'via', coordinates: [-23.5786, -46.6912] },
  { name: 'Ponte Eusébio Matoso', zone: 'Zona Oeste', kind: 'via', coordinates: [-23.5702, -46.7032] },
  { name: 'Avenida Vital Brasil', zone: 'Zona Oeste', kind: 'via', coordinates: [-23.5715, -46.7104] },

  // Zona Leste
  { name: 'Tatuapé', zone: 'Zona Leste', kind: 'bairro', coordinates: [-23.5404, -46.5768] },
  { name: 'Itaquera', zone: 'Zona Leste', kind: 'bairro', coordinates: [-23.5422, -46.4562] },
  { name: 'Mooca', zone: 'Zona Leste', kind: 'bairro', coordinates: [-23.5605, -46.5978] },
  { name: 'São Mateus', zone: 'Zona Leste', kind: 'bairro', coordinates: [-23.6125, -46.4765] },
  { name: 'Penha', zone: 'Zona Leste', kind: 'bairro', coordinates: [-23.5238, -46.5446] },
  { name: 'Vila Prudente', zone: 'Zona Leste', kind: 'bairro', coordinates: [-23.5844, -46.5821] },
  { name: 'Avenida Radial Leste', zone: 'Zona Leste', kind: 'via', coordinates: [-23.5438, -46.6020] },
  { name: 'Avenida Salim Farah Maluf', zone: 'Zona Leste', kind: 'via', coordinates: [-23.5515, -46.5782] },
  { name: 'Avenida Professor Luiz Ignácio Anhaia Mello', zone: 'Zona Leste', kind: 'via', coordinates: [-23.5890, -46.5655] },
  { name: 'Avenida Aricanduva', zone: 'Zona Leste', kind: 'via', coordinates: [-23.5635, -46.5025] },
  { name: 'Avenida Celso Garcia', zone: 'Zona Leste', kind: 'via', coordinates: [-23.5342, -46.5920] },
  { name: 'Avenida Sapopemba', zone: 'Zona Leste', kind: 'via', coordinates: [-23.5935, -46.5285] },

  // Zona Norte
  { name: 'Santana', zone: 'Zona Norte', kind: 'bairro', coordinates: [-23.5042, -46.6264] },
  { name: 'Vila Guilherme', zone: 'Zona Norte', kind: 'bairro', coordinates: [-23.5162, -46.6054] },
  { name: 'Tucuruvi', zone: 'Zona Norte', kind: 'bairro', coordinates: [-23.4804, -46.6032] },
  { name: 'Freguesia do Ó', zone: 'Zona Norte', kind: 'bairro', coordinates: [-23.4962, -46.7024] },
  { name: 'Avenida Cruzeiro do Sul', zone: 'Zona Norte', kind: 'via', coordinates: [-23.5168, -46.6248] },
  { name: 'Avenida General Ataliba Leonel', zone: 'Zona Norte', kind: 'via', coordinates: [-23.4922, -46.6125] },
  { name: 'Avenida Engenheiro Caetano Álvares', zone: 'Zona Norte', kind: 'via', coordinates: [-23.4928, -46.6472] },
  { name: 'Avenida Otaviano Alves de Lima', zone: 'Zona Norte', kind: 'via', coordinates: [-23.5082, -46.6625] },

  // Marginais e Pontes
  { name: 'Marginal Pinheiros', zone: 'Marginais e Pontes', kind: 'via', coordinates: [-23.5578, -46.7165] },
  { name: 'Marginal Tietê', zone: 'Marginais e Pontes', kind: 'via', coordinates: [-23.5165, -46.6495] },
  { name: 'Ponte da Casa Verde', zone: 'Marginais e Pontes', kind: 'via', coordinates: [-23.5138, -46.6522] },
];
