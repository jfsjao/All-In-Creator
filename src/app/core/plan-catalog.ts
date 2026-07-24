export type PaidPlanSlug = 'basic' | 'pro' | 'premium';
export type PlanSlug = 'gratuito' | PaidPlanSlug;

export interface PlanCatalogItem {
  slug: PlanSlug;
  name: string;
  price: number;
  summary: string;
  features: readonly string[];
}

export const PLAN_CATALOG: Readonly<Record<PlanSlug, PlanCatalogItem>> = {
  gratuito: {
    slug: 'gratuito',
    name: 'Gratuito',
    price: 0,
    summary: 'Quatro kits para conhecer a biblioteca.',
    features: ['Kit Streamer', 'Kit YouTube', 'Kit Influencer', 'Kit Designer']
  },
  basic: {
    slug: 'basic',
    name: 'Basic',
    price: 29.9,
    summary: 'Base essencial para criação e edição.',
    features: [
      'Biblioteca de Elementos', 'Pack de Emojis', 'Coleção de Ícones Profissionais',
      'Efeitos e Trilhas Sonoras', 'Kit Inicial de Edição de Vídeo',
      'Pack Adobe Premiere', 'Pack Adobe Photoshop', 'Softwares Essenciais do Criador',
      'Pack de Transições Dinâmicas', 'Banco de Vídeos Virais'
    ]
  },
  pro: {
    slug: 'pro',
    name: 'Pro',
    price: 65.9,
    summary: 'Tudo do Basic e mais recursos para ampliar o repertório.',
    features: [
      'Tudo do Basic', 'Pack CorelDraw', 'Sistema de Inteligência Artificial',
      'Biblioteca de Backgrounds', 'Templates Canva', 'Personagens Editáveis',
      'Efeitos VFX'
    ]
  },
  premium: {
    slug: 'premium',
    name: 'Premium',
    price: 97.9,
    summary: 'A biblioteca mais ampla disponível na All In Creator.',
    features: [
      'Tudo do Pro', 'Pack Adobe Illustrator', 'Pack Adobe Lightroom',
      'Pack After Effects', 'Ferramenta de download de Reels',
      'Banco de Vídeos Profissionais', 'Modelos de Gestão em Excel',
      'Biblioteca de Conteúdos PLR', 'Ferramentas Online', 'Kit de Marketing Digital'
    ]
  }
};

export function formatPlanPrice(price: number): string {
  return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
