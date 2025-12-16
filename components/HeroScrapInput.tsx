import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface HeroScrapInputProps {
  onScrap: (url: string) => Promise<void>;
  isLoading: boolean;
}

const HeroScrapInput: React.FC<HeroScrapInputProps> = ({ onScrap, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. 텍스트에서 URL만 추출하는 함수
  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex) || [];
    // 중복 제거
    return [...new Set(matches)];
  };

  // 2. 입력 처리 함수
  const handleScrap = async () => {
    if (!inputValue.trim()) {
      toast.error('링크를 입력해주세요! 😊');
      return;
    }

    const urls = extractUrls(inputValue);
    
    if (urls.length === 0) {
      toast.error('유효한 링크를 찾을 수 없어요 😢\nhttp:// 또는 https://로 시작하는 링크를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    const originalValue = inputValue;
    setInputValue(''); // 입력창 비우기 (사용자 경험 향상)

    let successCount = 0;
    let failCount = 0;

    // 로딩 토스트
    const toastId = toast.loading(
      urls.length > 1 
        ? `${urls.length}개의 링크를 스크랩하고 있어요...` 
        : '스크랩하고 있어요...'
    );

    // 3. 추출된 URL들을 하나씩 처리
    for (const url of urls) {
      try {
        await onScrap(url);
        successCount++;
        
        // 개별 성공 알림 (너무 많으면 생략)
        if (urls.length <= 3) {
          toast.success(`✅ ${new URL(url).hostname}`, { duration: 2000 });
        }
      } catch (error: any) {
        failCount++;
        const hostname = (() => {
          try {
            return new URL(url).hostname;
          } catch {
            return url.substring(0, 30) + '...';
          }
        })();
        
        // 에러 메시지 파싱
        const errorMsg = error?.message || '알 수 없는 오류';
        
        if (errorMsg.includes('지원') || errorMsg.includes('support')) {
          toast.error(`❌ 지원하지 않는 사이트: ${hostname}`, { duration: 4000 });
        } else {
          toast.error(`⚠️ 스크랩 실패: ${hostname}`, { duration: 3000 });
        }
        
        console.error(`스크랩 실패 [${url}]:`, error);
      }
      
      // 너무 빠르게 처리되면 부자연스러우니 약간의 딜레이
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    toast.dismiss(toastId); // 로딩 토스트 제거
    
    // 최종 결과 알림
    if (successCount > 0 && failCount === 0) {
      toast.success(
        `🎉 ${successCount}개의 카드가 생성되었어요!`, 
        { duration: 3000, icon: '✨' }
      );
    } else if (successCount > 0 && failCount > 0) {
      toast.success(
        `✅ ${successCount}개 성공, ❌ ${failCount}개 실패`, 
        { duration: 3000 }
      );
    } else if (failCount > 0) {
      toast.error(
        `모든 링크 처리에 실패했어요 😢\n지원하는 사이트인지 확인해주세요.`, 
        { duration: 4000 }
      );
      // 실패 시 원래 입력값 복원
      setInputValue(originalValue);
    }

    setIsProcessing(false);
  };

  // 엔터키 누르면 실행
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing && !isLoading) {
      handleScrap();
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-12 md:py-16 sm:py-8 px-4">
      {/* 타이틀 */}
      <div className="text-center mb-8 md:mb-10 sm:mb-6">
        <h1 className="text-5xl md:text-6xl sm:text-4xl font-bold text-stone-800 mb-4 font-handwriting">
          오늘을 스크랩하세요 ✨
        </h1>
        <p className="text-stone-500 text-lg md:text-xl sm:text-base">
          링크만 붙여넣으면 자동으로 예쁜 카드가 만들어져요
        </p>
      </div>

      {/* 검색창 스타일의 입력 바 */}
      <div className="relative w-full max-w-3xl">
        <div className="flex items-center w-full min-h-[56px] px-6 md:px-8 sm:px-5 py-3 rounded-full bg-white shadow-lg border-2 border-stone-200 focus-within:border-blue-400 focus-within:shadow-xl transition-all">
          <span className="text-2xl mr-3 flex-shrink-0">🔗</span>
          <textarea
            rows={1}
            className="w-full outline-none text-stone-700 placeholder-stone-400 bg-transparent resize-none overflow-hidden font-sans text-base leading-relaxed"
            placeholder="링크를 붙여넣으세요 (여러 개도 OK! 카톡 대화 내용째로 복붙해도 됩니다)"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // 자동 높이 조절
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            disabled={isProcessing || isLoading}
            style={{ maxHeight: '120px' }}
          />
          <button 
            onClick={handleScrap}
            disabled={isProcessing || isLoading || !inputValue.trim()}
            className="ml-3 px-5 py-2 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 active:scale-95 disabled:bg-stone-300 disabled:cursor-not-allowed transition-all flex-shrink-0 text-sm"
          >
            {isProcessing || isLoading ? '⏳' : '스크랩'}
          </button>
        </div>

        {/* 팁 텍스트 */}
        <p className="mt-3 text-xs text-stone-400 text-center">
          💡 Tip: Ctrl+V (Cmd+V)로 붙여넣기 후 Enter를 누르세요
        </p>
      </div>

      {/* 지원 사이트 힌트 */}
      <div className="mt-8 md:mt-10 sm:mt-6 flex flex-wrap justify-center gap-3 md:gap-4 sm:gap-2 text-xs md:text-sm sm:text-xs">
        <span className="px-3 py-1.5 bg-white rounded-full shadow-sm border border-stone-200 text-stone-600 flex items-center gap-1">
          <span className="text-red-500">▶</span> YouTube
        </span>
        <span className="px-3 py-1.5 bg-white rounded-full shadow-sm border border-stone-200 text-stone-600 flex items-center gap-1">
          <span className="text-blue-500">🐦</span> Twitter
        </span>
        <span className="px-3 py-1.5 bg-white rounded-full shadow-sm border border-stone-200 text-stone-600 flex items-center gap-1">
          <span className="text-pink-500">📷</span> Instagram
        </span>
        <span className="px-3 py-1.5 bg-white rounded-full shadow-sm border border-stone-200 text-stone-600 flex items-center gap-1">
          <span className="text-green-500">N</span> Naver
        </span>
        <span className="px-3 py-1.5 bg-white rounded-full shadow-sm border border-stone-200 text-stone-600 flex items-center gap-1">
          <span className="text-orange-500">📚</span> 알라딘
        </span>
        <span className="px-3 py-1.5 bg-white rounded-full shadow-sm border border-stone-200 text-stone-600 flex items-center gap-1">
          <span className="text-purple-500">📌</span> Pinterest
        </span>
      </div>
    </div>
  );
};

export default HeroScrapInput;

