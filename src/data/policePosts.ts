import { SaoPauloZone } from './saoPauloLocations';
import { calculateDistanceMeters } from '../services/api';

export interface PolicePostEntry {
  id: string;
  name: string;
  zone: SaoPauloZone;
  address: string;
  neighborhood: string;
  coordinates: [number, number];
  phone: string;
  is24h: boolean;
}

export interface PolicePostResult extends PolicePostEntry {
  distanceMeters: number;
  distanceLabel: string;
}

export const SP_POLICE_POSTS: PolicePostEntry[] = [
  // Centro
  {
    id: 'dp-01-se',
    name: '1º Distrito Policial (Sé)',
    zone: 'Centro',
    neighborhood: 'Sé / Liberdade',
    address: 'Rua da Glória, 410 - Liberdade / Sé',
    coordinates: [-23.5567, -46.6345],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-02-bom-retiro',
    name: '2º Distrito Policial (Bom Retiro / Luz)',
    zone: 'Centro',
    neighborhood: 'Bom Retiro / Luz',
    address: 'Rua dos Italianos, 386 - Bom Retiro',
    coordinates: [-23.5276, -46.6391],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-03-campos-eliseos',
    name: '3º Distrito Policial (Campos Elíseos)',
    zone: 'Centro',
    neighborhood: 'Campos Elíseos / República',
    address: 'Rua Aurora, 322 - Santa Ifigênia',
    coordinates: [-23.5393, -46.6397],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-04-consolacao',
    name: '4º Distrito Policial (Consolação / Paulista)',
    zone: 'Centro',
    neighborhood: 'Consolação / Av. Paulista',
    address: 'Rua Marquês de Paranaguá, 246 - Consolação',
    coordinates: [-23.5512, -46.6542],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-78-jardins',
    name: '78º Distrito Policial (Jardins / Paulista)',
    zone: 'Centro',
    neighborhood: 'Jardins / Avenida Paulista',
    address: 'Rua Estados Unidos, 1608 - Jardim América',
    coordinates: [-23.5681, -46.6703],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-08-bras',
    name: '8º Distrito Policial (Brás / Belenzinho)',
    zone: 'Centro',
    neighborhood: 'Brás',
    address: 'Av. Celso Garcia, 505 - Brás',
    coordinates: [-23.5416, -46.6095],
    phone: '190',
    is24h: true,
  },

  // Zona Sul
  {
    id: 'dp-36-vila-mariana',
    name: '36º Distrito Policial (Vila Mariana / Paraíso)',
    zone: 'Zona Sul',
    neighborhood: 'Vila Mariana',
    address: 'Rua Tutóia, 921 - Paraíso / Vila Mariana',
    coordinates: [-23.5811, -46.6456],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-27-ibira',
    name: '27º Distrito Policial (Campo Belo / Moema)',
    zone: 'Zona Sul',
    neighborhood: 'Moema / Ibirapuera',
    address: 'Av. dos Bandeirantes, 3220 - Campo Belo',
    coordinates: [-23.6197, -46.6634],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-11-santo-amaro',
    name: '11º Distrito Policial (Santo Amaro)',
    zone: 'Zona Sul',
    neighborhood: 'Santo Amaro',
    address: 'Rua Padre José de Anchieta, 138 - Santo Amaro',
    coordinates: [-23.6524, -46.7068],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-47-capao-redondo',
    name: '47º Distrito Policial (Capão Redondo)',
    zone: 'Zona Sul',
    neighborhood: 'Capão Redondo',
    address: 'Estrada de Itapecerica, 5888 - Capão Redondo',
    coordinates: [-23.6684, -46.7745],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-37-campo-limpo',
    name: '37º Distrito Policial (Campo Limpo)',
    zone: 'Zona Sul',
    neighborhood: 'Campo Limpo',
    address: 'Estrada do Campo Limpo, 2500 - Campo Limpo',
    coordinates: [-23.6438, -46.7574],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-35-jabaquara',
    name: '35º Distrito Policial (Jabaquara)',
    zone: 'Zona Sul',
    neighborhood: 'Jabaquara',
    address: 'Av. Eng. Armando de Arruda Pereira, 2195',
    coordinates: [-23.6458, -46.6436],
    phone: '190',
    is24h: true,
  },

  // Zona Oeste
  {
    id: 'dp-14-pinheiros',
    name: '14º Distrito Policial (Pinheiros / Faria Lima)',
    zone: 'Zona Oeste',
    neighborhood: 'Pinheiros / Faria Lima',
    address: 'Rua Deputado Lacerda Franco, 372 - Pinheiros',
    coordinates: [-23.5625, -46.6914],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-07-lapa',
    name: '7º Distrito Policial (Lapa)',
    zone: 'Zona Oeste',
    neighborhood: 'Lapa',
    address: 'Rua Camilo, 317 - Vila Romana / Lapa',
    coordinates: [-23.5284, -46.6952],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-23-perdizes',
    name: '23º Distrito Policial (Perdizes)',
    zone: 'Zona Oeste',
    neighborhood: 'Perdizes',
    address: 'Rua Itapicuru, 80 - Perdizes',
    coordinates: [-23.5356, -46.6708],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-51-butanta',
    name: '51º Distrito Policial (Butantã)',
    zone: 'Zona Oeste',
    neighborhood: 'Butantã',
    address: 'Av. Corifeu de Azevedo Marques, 4300 - Butantã',
    coordinates: [-23.5697, -46.7438],
    phone: '190',
    is24h: true,
  },

  // Zona Leste
  {
    id: 'dp-30-tatuape',
    name: '30º Distrito Policial (Tatuapé / Radial Leste)',
    zone: 'Zona Leste',
    neighborhood: 'Tatuapé',
    address: 'Rua Antônio Camardo, 69 - Tatuapé',
    coordinates: [-23.5419, -46.5761],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-18-mooca',
    name: '18º Distrito Policial (Alto da Mooca)',
    zone: 'Zona Leste',
    neighborhood: 'Mooca',
    address: 'Rua da Mooca, 3185 - Alto da Mooca',
    coordinates: [-23.5579, -46.5886],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-10-penha',
    name: '10º Distrito Policial (Penha)',
    zone: 'Zona Leste',
    neighborhood: 'Penha',
    address: 'Av. Gabriela Mistral, 1255 - Penha',
    coordinates: [-23.5229, -46.5441],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-24-itaquera',
    name: '32º Distrito Policial (Itaquera)',
    zone: 'Zona Leste',
    neighborhood: 'Itaquera',
    address: 'Rua Gregório Ramalho, 286 - Itaquera',
    coordinates: [-23.5389, -46.4539],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-49-sao-mateus',
    name: '49º Distrito Policial (São Mateus)',
    zone: 'Zona Leste',
    neighborhood: 'São Mateus',
    address: 'Av. Mateo Bei, 2000 - São Mateus',
    coordinates: [-23.6119, -46.4731],
    phone: '190',
    is24h: true,
  },

  // Zona Norte
  {
    id: 'dp-09-santana',
    name: '9º Distrito Policial (Carandiru / Santana)',
    zone: 'Zona Norte',
    neighborhood: 'Santana',
    address: 'Av. Cruzeiro do Sul, 3150 - Carandiru / Santana',
    coordinates: [-23.5059, -46.6251],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-20-agua-fria',
    name: '20º Distrito Policial (Água Fria / Tucuruvi)',
    zone: 'Zona Norte',
    neighborhood: 'Tucuruvi',
    address: 'Av. Águas de São Pedro, 45 - Tucuruvi',
    coordinates: [-23.4831, -46.6152],
    phone: '190',
    is24h: true,
  },
  {
    id: 'dp-28-freguesia',
    name: '28º Distrito Policial (Freguesia do Ó)',
    zone: 'Zona Norte',
    neighborhood: 'Freguesia do Ó',
    address: 'Av. João Paulo I, 1280 - Freguesia do Ó',
    coordinates: [-23.4956, -46.6952],
    phone: '190',
    is24h: true,
  },
];

function formatDist(meters: number): string {
  if (meters < 1000) return `${Math.max(50, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function findNearestPolicePosts(
  coordinates: [number, number],
  count = 3
): PolicePostResult[] {
  return SP_POLICE_POSTS.map((post) => {
    const d = calculateDistanceMeters(
      coordinates[0],
      coordinates[1],
      post.coordinates[0],
      post.coordinates[1]
    );
    return {
      ...post,
      distanceMeters: Math.round(d),
      distanceLabel: formatDist(d),
    };
  })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, count);
}
