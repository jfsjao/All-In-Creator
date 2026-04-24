import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { ApiService, MeusPacksResponse, PackResponse } from '../api.service';
import { mapPacksWithImage } from '../pack-image-map';

export type UserPlanSlug = 'gratuito' | 'basic' | 'pro' | 'premium';

export interface UserLibraryPack {
  id: number;
  title: string;
  description: string;
  image: string;
  badge: string;
  locked: boolean;
  link: string;
  downloadUrl: string | null;
}

export interface UserLibraryData {
  userId: number;
  plan: {
    slug: UserPlanSlug;
    nome: string;
    status: string;
  };
  ownedPacks: UserLibraryPack[];
  featuredPacks: UserLibraryPack[];
  noveltyPacks: UserLibraryPack[];
  allPacks: UserLibraryPack[];
  upgradePacks: UserLibraryPack[];
  popularPacks: UserLibraryPack[];
}

@Injectable({
  providedIn: 'root'
})
export class UserLibraryService {
  private apiService = inject(ApiService);

  loadUserLibrary(usuarioId: number): Observable<UserLibraryData> {
    return forkJoin({
      meusPacks: this.apiService.getMeusPacks(usuarioId),
      destaquePacks: this.apiService.getPacksDestaque(10),
      allPacks: this.apiService.getAllPacks()
    }).pipe(
      map(({ meusPacks, destaquePacks, allPacks }) => this.buildLibraryData(meusPacks, destaquePacks.packs, allPacks.packs))
    );
  }

  private buildLibraryData(
    meusPacks: MeusPacksResponse,
    destaquePacks: PackResponse[],
    allPacks: PackResponse[],
  ): UserLibraryData {
    const ownedPacks = mapPacksWithImage(meusPacks.packs).map((pack) => ({
      id: pack.id,
      title: pack.nome,
      description: pack.descricao,
      image: pack.image,
      badge: 'Liberado',
      locked: false,
      link: '/library',
      downloadUrl: pack.arquivo_url
    }));

    const ownedPackIds = new Set(ownedPacks.map((pack) => pack.id));

    const featuredPacks = mapPacksWithImage(destaquePacks).map((pack, index) => ({
      id: pack.id,
      title: pack.nome,
      description: pack.descricao,
      image: pack.image,
      badge: `Top ${index + 1}`,
      locked: !ownedPackIds.has(pack.id),
      link: ownedPackIds.has(pack.id) ? '/my-downloads' : '/plans',
      downloadUrl: ownedPackIds.has(pack.id) ? pack.arquivo_url : null
    }));

    const featuredPackIds = new Set(featuredPacks.map((pack) => pack.id));

    const allPacksWithAccess = mapPacksWithImage(allPacks).map((pack) => ({
      id: pack.id,
      title: pack.nome,
      description: pack.descricao,
      image: pack.image,
      badge: ownedPackIds.has(pack.id) ? 'Liberado' : 'Upgrade',
      locked: !ownedPackIds.has(pack.id),
      link: ownedPackIds.has(pack.id) ? '/my-downloads' : '/plans',
      downloadUrl: ownedPackIds.has(pack.id) ? pack.arquivo_url : null
    }));

    const noveltyPacks = allPacksWithAccess
      .filter((pack) => !featuredPackIds.has(pack.id))
      .slice(0, 8)
      .map((pack, index) => ({
        ...pack,
        badge: pack.locked ? `Novo ${index + 1}` : `Novo ${index + 1}`
      }));

    const popularPacks = featuredPacks;

    const upgradePacks = allPacksWithAccess
      .filter((pack) => !ownedPackIds.has(pack.id))
      .map((pack) => ({
        id: pack.id,
        title: pack.title,
        description: pack.description,
        image: pack.image,
        badge: 'Upgrade',
        locked: true,
        link: '/plans',
        downloadUrl: null
      }));

    return {
      userId: meusPacks.usuario_id,
      plan: {
        slug: meusPacks.plano_atual.slug,
        nome: meusPacks.plano_atual.nome,
        status: meusPacks.plano_atual.status
      },
      ownedPacks,
      featuredPacks,
      noveltyPacks,
      allPacks: allPacksWithAccess,
      upgradePacks,
      popularPacks
    };
  }
}
