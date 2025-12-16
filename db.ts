// db.ts - Dexie.js Database Configuration
import Dexie, { Table } from 'dexie';
import { ScrapItem, LayoutTextData, DiaryStyle } from './types';

// 1. 저장할 데이터의 인터페이스 정의
export interface DiaryData {
  id?: number; // 자동 생성되는 번호
  key: string; // 'items', 'textData', 'style' 등
  data: ScrapItem[] | LayoutTextData | DiaryStyle; // 실제 데이터
  lastModified: Date;
}

// 2. 백업용 스냅샷 인터페이스
export interface DiaryBackup {
  id?: number;
  timestamp: Date;
  items: ScrapItem[];
  textData: LayoutTextData;
  style: DiaryStyle;
  description?: string;
}

// 3. 데이터베이스 클래스 정의
class DiaryDatabase extends Dexie {
  // 테이블 선언
  diaryData!: Table<DiaryData>;
  backups!: Table<DiaryBackup>;

  constructor() {
    super('SmartScrapDiaryDB'); // DB 이름
    
    // 버전 1: 초기 스키마
    this.version(1).stores({
      diaryData: '++id, key, lastModified', // key로 검색 가능
      backups: '++id, timestamp' // 타임스탬프로 검색 가능
    });
  }

  // 헬퍼 메서드: Items 저장/불러오기
  async saveItems(items: ScrapItem[]) {
    return await this.diaryData.put({
      key: 'items',
      data: items,
      lastModified: new Date()
    });
  }

  async getItems(): Promise<ScrapItem[]> {
    const record = await this.diaryData.where('key').equals('items').first();
    return (record?.data as ScrapItem[]) || [];
  }

  // 헬퍼 메서드: Text Data 저장/불러오기
  async saveTextData(textData: LayoutTextData) {
    return await this.diaryData.put({
      key: 'textData',
      data: textData,
      lastModified: new Date()
    });
  }

  async getTextData(): Promise<LayoutTextData> {
    const record = await this.diaryData.where('key').equals('textData').first();
    return (record?.data as LayoutTextData) || {};
  }

  // 헬퍼 메서드: Style 저장/불러오기
  async saveStyle(style: DiaryStyle) {
    return await this.diaryData.put({
      key: 'style',
      data: style,
      lastModified: new Date()
    });
  }

  async getStyle(): Promise<DiaryStyle | null> {
    const record = await this.diaryData.where('key').equals('style').first();
    return (record?.data as DiaryStyle) || null;
  }

  // 전체 백업 생성
  async createBackup(description?: string) {
    const items = await this.getItems();
    const textData = await this.getTextData();
    const style = await this.getStyle();

    return await this.backups.add({
      timestamp: new Date(),
      items,
      textData,
      style: style || {
        coverColor: '#ffffff',
        coverPattern: 'quilt',
        keyring: 'https://i.ibb.co/V0JFcWp8/0000-1.png',
        backgroundImage: ''
      },
      description
    });
  }

  // 백업 목록 가져오기
  async getBackups() {
    return await this.backups.orderBy('timestamp').reverse().toArray();
  }

  // 백업에서 복원
  async restoreFromBackup(backupId: number) {
    const backup = await this.backups.get(backupId);
    if (!backup) throw new Error('백업을 찾을 수 없습니다');

    await this.saveItems(backup.items);
    await this.saveTextData(backup.textData);
    await this.saveStyle(backup.style);

    return backup;
  }

  // 백업 삭제
  async deleteBackup(backupId: number) {
    return await this.backups.delete(backupId);
  }

  // LocalStorage에서 마이그레이션
  async migrateFromLocalStorage() {
    const STORAGE_KEY = 'smart_scrap_diary_layout_v2';
    const TEXT_DATA_KEY = 'smart_scrap_text_data';
    const STYLE_PREF_KEY = 'smart_scrap_style_pref';

    // 기존 데이터 확인
    const existingItems = await this.getItems();
    if (existingItems.length > 0) {
      console.log('DB에 이미 데이터가 있습니다. 마이그레이션을 건너뜁니다.');
      return;
    }

    // LocalStorage에서 가져오기
    const itemsStr = localStorage.getItem(STORAGE_KEY);
    const textDataStr = localStorage.getItem(TEXT_DATA_KEY);
    const styleStr = localStorage.getItem(STYLE_PREF_KEY);

    if (itemsStr) {
      try {
        const items: ScrapItem[] = JSON.parse(itemsStr);
        await this.saveItems(items);
        console.log(`${items.length}개 아이템 마이그레이션 완료`);
      } catch (e) {
        console.error('Items 마이그레이션 실패:', e);
      }
    }

    if (textDataStr) {
      try {
        const textData: LayoutTextData = JSON.parse(textDataStr);
        await this.saveTextData(textData);
        console.log('텍스트 데이터 마이그레이션 완료');
      } catch (e) {
        console.error('TextData 마이그레이션 실패:', e);
      }
    }

    if (styleStr) {
      try {
        const style: DiaryStyle = JSON.parse(styleStr);
        await this.saveStyle(style);
        console.log('스타일 마이그레이션 완료');
      } catch (e) {
        console.error('Style 마이그레이션 실패:', e);
      }
    }

    // 마이그레이션 성공 후 자동 백업
    if (itemsStr || textDataStr || styleStr) {
      await this.createBackup('LocalStorage에서 자동 마이그레이션');
      console.log('✅ 마이그레이션 백업 생성 완료');
    }
  }

  // JSON 파일로 내보내기
  async exportToJSON() {
    const items = await this.getItems();
    const textData = await this.getTextData();
    const style = await this.getStyle();

    const exportData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      items,
      textData,
      style
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // JSON 파일에서 가져오기
  async importFromJSON(file: File) {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);

          // 백업 먼저 생성
          await this.createBackup('가져오기 전 자동 백업');

          // 데이터 복원
          if (importData.items) await this.saveItems(importData.items);
          if (importData.textData) await this.saveTextData(importData.textData);
          if (importData.style) await this.saveStyle(importData.style);

          console.log('✅ JSON 가져오기 완료');
          resolve();
        } catch (error) {
          console.error('JSON 가져오기 실패:', error);
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}

// 싱글톤 인스턴스 내보내기
export const db = new DiaryDatabase();


