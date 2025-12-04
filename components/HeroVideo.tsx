import React from 'react';

const HeroVideo = () => {
  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden bg-gray-100">
      <div className="absolute inset-0 pointer-events-none">
        <iframe 
          className="w-full h-full scale-150 pointer-events-none"
          src="https://www.youtube.com/embed/C5KXWmA6XD8?autoplay=1&mute=1&controls=0&loop=1&playlist=C5KXWmA6XD8&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1&vq=hd1080&quality=high&playsinline=1" 
          title="IKEVEGE Hero Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          frameBorder="0"
          allowFullScreen
        ></iframe>
      </div>
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <div className="text-center text-white p-4 animate-fade-in">
          {/* Optional Text overlay if needed, the video has its own text usually */}
        </div>
      </div>
    </div>
  );
};

export default HeroVideo;