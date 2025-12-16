<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 📔 Digital Scrap Diary

오늘 하루 인상 깊었던 모든 것을 링크 하나로 기록하세요!  
YouTube, Twitter, Instagram, 네이버 블로그, 알라딘... 링크만 붙여넣으면 자동으로 예쁜 카드가 만들어집니다.

## ✨ 주요 기능

### 🔗 멀티 링크 스크랩
- **한 번에 여러 링크 처리**: 카톡 대화 내용을 통째로 복사해도 OK!
- **정규표현식 자동 감지**: 텍스트 속 모든 URL을 자동으로 추출
- **지원 사이트**: YouTube, Twitter, Instagram, Pinterest, 네이버, 알라딘, Yes24 등

### 💾 Dexie.js 데이터베이스
- **서버 비용 0원**: 브라우저에 안전하게 저장
- **LocalStorage보다 강력**: 더 큰 용량, 더 빠른 속도
- **실시간 동기화**: 데이터 변경 시 자동 화면 업데이트

### 📦 백업 시스템
- **내부 백업**: 브라우저 DB에 스냅샷 저장
- **JSON 내보내기**: 파일로 다운로드하여 안전하게 보관
- **JSON 가져오기**: 백업 파일로 언제든 복원

### 🎨 다양한 레이아웃
- **월간 캘린더**: 한 달 전체를 한눈에
- **주간 스프레드**: 주간 플래닝
- **자유 페이지**: 마음대로 꾸미기
- **스크랩북 페이지**: 즐겨찾기 모음

## 🚀 시작하기

### 필수 요구사항
- Node.js (v16 이상 권장)
- Gemini API Key ([무료 발급](https://makersuite.google.com/app/apikey))

### 설치 및 실행

1. **패키지 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   
   `.env.local` 파일을 생성하고 Gemini API Key를 추가하세요:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **브라우저에서 열기**
   
   `http://localhost:5173` 접속

## 📖 사용 방법

### 기본 스크랩
1. 상단 입력창에 링크를 붙여넣기
2. Enter 또는 "스크랩" 버튼 클릭
3. 자동으로 카드 생성! 🎉

### 멀티 링크 스크랩
```
친구: 이거 봤어? https://youtube.com/watch?v=abc123
나: ㅋㅋ 이것도 https://twitter.com/user/status/123
친구: 이 책 추천! https://aladin.co.kr/shop/...
```
위 대화를 통째로 복사 → 붙여넣기 → 3개 카드 자동 생성!

### 백업하기
- **💾 저장**: 현재 작업 저장
- **📦 백업**: 메모와 함께 스냅샷 생성
- **📥 내보내기**: JSON 파일로 다운로드
- **📤 가져오기**: 백업 파일로 복원

## ⚠️ 중요 안내

> 💡 **소중한 데이터를 위해 주기적으로 [📥 내보내기]를 눌러 백업 파일을 저장해주세요!**

**알아두세요:**
- ✅ 데이터는 **브라우저**에 저장됩니다
- ⚠️ 다른 기기/브라우저에서는 보이지 않습니다
- ⚠️ 브라우저 캐시 삭제 시 데이터가 사라질 수 있습니다
- ✅ 정기적인 백업 파일 다운로드를 권장합니다!

## 🛠️ 기술 스택

- **Frontend**: React 19 + TypeScript + Vite
- **Database**: Dexie.js (IndexedDB wrapper)
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS
- **Toast**: react-hot-toast

## 📝 라이선스

This project was created with [AI Studio](https://ai.studio).

View your app in AI Studio: https://ai.studio/apps/drive/1Y6mAWCq2Er5TzlV_vetzO7r5RMzW0C2v

## 🎨 개발자를 위한 메모

### 주요 컴포넌트
- `HeroScrapInput.tsx`: 멀티 링크 입력 컴포넌트
- `App.tsx`: 메인 앱 로직
- `db.ts`: Dexie.js 데이터베이스 설정

### 새 사이트 지원 추가하기
1. `services/urlParser.ts`에 URL 패턴 추가
2. `services/geminiService.ts`에 메타데이터 추출 로직 추가
3. 필요시 전용 컴포넌트 생성 (`components/items/`)

---

<div align="center">
Made with ❤️ and ☕
</div>
