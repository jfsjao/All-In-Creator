import { PackResponse } from './api.service';

export type PackWithImage<T extends { slug?: string; nome?: string }> = T & {
  image: string;
};

const DEFAULT_PACK_IMAGE = 'assets/images/packs/elementos.webp';

const PACK_IMAGES: Record<string, string> = {
  'biblioteca-premium-avancada-de-elementos': 'assets/images/packs/elementos.webp',
  'pack-de-emojis-exclusivos-pro': 'assets/images/packs/emojis.webp',
  'colecao-premium-de-icones-profissionais': 'assets/images/packs/icones.webp',
  'efeitos-e-trilhas-sonoras': 'assets/images/packs/Efeitos-e-Trilha-Sonoras.webp',
  'kit-avancado-de-edicao-de-video-pro': 'assets/images/packs/capa_pack_edição.webp',
  'pack-adobe-premiere-pro-completo': 'assets/images/packs/premiere.webp',
  'pack-adobe-photoshop-completo': 'assets/images/packs/kit_photoshop.webp',
  'pack-de-transicoes-cinematograficas': 'assets/images/packs/transições.webp',
  'pack-coreldraw-avancado': 'assets/images/packs/Pacote-CorelDraw.webp',
  'pack-adobe-illustrator-profissional': 'assets/images/packs/illustrator_Pack.webp',
  'pack-adobe-lightroom-profissional': 'assets/images/packs/presets_lightroom.webp',
  'pack-after-effects-cinematografico': 'assets/images/packs/kit_after_effects.webp',
  'softwares-exclusivos-do-criador': 'assets/images/packs/programas.webp',
  'banco-premium-de-videos-virais': 'assets/images/packs/PACK_VIRAL.webp',
  'sistema-avancado-de-inteligencia-artificial': 'assets/images/packs/IA.webp',
  'biblioteca-premium-de-backgrounds': 'assets/images/packs/kit_background.webp',
  'colecao-completa-de-templates-canva': 'assets/images/packs/canva.webp',
  'pack-avancado-de-personagens-editaveis': 'assets/images/packs/personagens.webp',
  'pack-vfx-cinematografico-profissional': 'assets/images/packs/VFX.webp',
  'ferramenta-profissional-de-download-de-reels': 'assets/images/packs/baixar_reels.webp',
  'banco-exclusivo-de-videos-profissionais': 'assets/images/packs/banco_de_videos.webp',
  'modelos-profissionais-de-gestao-em-excel': 'assets/images/packs/Modelos-Excel.webp',
  'biblioteca-de-conteudos-plr-premium': 'assets/images/packs/Pack_PLRs.webp',
  'suite-de-ferramentas-online-profissionais': 'assets/images/packs/ferramentas_online.webp',
  'kit-completo-de-marketing-digital': 'assets/images/packs/kit-marketing.webp',
  
};

function normalizePackKey(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

export function getPackImageBySlug(slug?: string | null): string {
  const normalizedSlug = normalizePackKey(slug);
  return PACK_IMAGES[normalizedSlug] ?? DEFAULT_PACK_IMAGE;
}

export function getPackImageByName(name?: string | null): string {
  const normalizedName = normalizePackKey(name);
  return PACK_IMAGES[normalizedName] ?? DEFAULT_PACK_IMAGE;
}

export function resolvePackImage(pack: { slug?: string | null; nome?: string | null }): string {
  const normalizedSlug = normalizePackKey(pack.slug);

  if (normalizedSlug && PACK_IMAGES[normalizedSlug]) {
    return PACK_IMAGES[normalizedSlug];
  }

  const normalizedName = normalizePackKey(pack.nome);

  if (normalizedName && PACK_IMAGES[normalizedName]) {
    return PACK_IMAGES[normalizedName];
  }

  return DEFAULT_PACK_IMAGE;
}

export function mapPackWithImage<T extends { slug?: string; nome?: string }>(pack: T): PackWithImage<T> {
  return {
    ...pack,
    image: resolvePackImage(pack)
  };
}

export function mapPacksWithImage<T extends { slug?: string; nome?: string }>(packs: T[]): Array<PackWithImage<T>> {
  return packs.map((pack) => mapPackWithImage(pack));
}
