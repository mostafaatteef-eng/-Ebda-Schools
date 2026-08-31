import { MasterDataCategory, MasterDataItem } from '../types';
import { DEFAULT_MASTER_DATA, STORAGE_KEYS } from './storageServiceConstants';
import { getCairoNowISO } from '../utils/egyptianTime';

export class MasterDataService {
  private static getStorageKey(): string {
    return STORAGE_KEYS.MASTER_DATA || 'ntss_master_data_v3';
  }

  public static getMasterData(category?: MasterDataCategory, typeKey?: string): MasterDataItem[] {
    const raw = localStorage.getItem(this.getStorageKey());
    let list: MasterDataItem[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    if (list.length === 0) {
      list = DEFAULT_MASTER_DATA;
      localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    }

    return list.filter(item => {
      if (category && item.category !== category) return false;
      if (typeKey && item.typeKey !== typeKey) return false;
      return true;
    });
  }

  public static saveMasterDataItem(item: Partial<MasterDataItem>): { success: boolean; data?: MasterDataItem; message?: string } {
    const list = this.getMasterData();
    const now = getCairoNowISO();

    const prepared: MasterDataItem = {
      id: item.id || `MD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category: item.category || 'SYSTEM',
      typeKey: item.typeKey || 'GENERAL',
      code: (item.code || '').trim().toUpperCase(),
      nameAr: (item.nameAr || '').trim(),
      nameEn: (item.nameEn || '').trim(),
      description: (item.description || '').trim(),
      parentId: item.parentId,
      sortOrder: item.sortOrder ?? list.length + 1,
      isActive: item.isActive ?? true,
      isSystemProtected: item.isSystemProtected ?? false,
      metaData: item.metaData,
      effectiveFrom: item.effectiveFrom,
      effectiveTo: item.effectiveTo,
      createdAt: item.createdAt || now,
      updatedAt: now,
    };

    const idx = list.findIndex(i => i.id === prepared.id);
    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.push(prepared);
    }

    localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    return { success: true, data: prepared, message: 'تم حفظ البند في التعريفات والقوائم بنجاح' };
  }

  public static toggleActive(id: string): { success: boolean } {
    const list = this.getMasterData();
    const idx = list.findIndex(i => i.id === id);
    if (idx >= 0) {
      list[idx].isActive = !list[idx].isActive;
      list[idx].updatedAt = getCairoNowISO();
      localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
      return { success: true };
    }
    return { success: false };
  }
}
