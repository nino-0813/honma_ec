import React, { useState, useEffect, useRef } from 'react';

const HeroVideo = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // YouTube動画のURLパラメータを最適化（クライアントサイドでのみ実行）
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `https://www.youtube.com/embed/C5KXWmA6XD8?autoplay=1&mute=1&controls=0&loop=1&playlist=C5KXWmA6XD8&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1&vq=hd1080&enablejsapi=1&origin=${origin}&playsinline=1&cc_load_policy=0&fs=0&start=0`;
    setVideoUrl(url);

    // 動画の読み込み完了を検知（フォールバック）
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsLoaded(true);
    }, 2000); // 2秒後に読み込み完了とみなす

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] md:h-[80vh] overflow-hidden bg-gray-900">
      {/* 読み込み中のプレースホルダー */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-white text-sm animate-pulse">読み込み中...</div>
        </div>
      )}

      {/* YouTube動画 */}
      {videoUrl && (
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <iframe 
            ref={iframeRef}
            className="w-full h-full scale-150 pointer-events-none"
            src={videoUrl}
            title="IKEVEGE Hero Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            frameBorder="0"
            allowFullScreen
            loading="eager"
            onLoad={() => {
              setIsLoading(false);
              setIsLoaded(true);
            }}
          ></iframe>
        </div>
      )}
      
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
        <div className="text-center text-white p-4 animate-fade-in">
          {/* Optional Text overlay if needed, the video has its own text usually */}
        </div>
      </div>
    </div>
  );
};

export default HeroVideo;