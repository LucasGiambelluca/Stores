
import React from 'react';

interface ProductVideoProps {
  videoUrl?: string;
  autoplay?: boolean;
  showControls?: boolean;
}

const ProductVideo: React.FC<ProductVideoProps> = ({
  videoUrl,
  autoplay = false,
  showControls = true
}) => {
  if (!videoUrl) return null;

  // Helper to get embed URL
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('v=') 
          ? url.split('v=')[1].split('&')[0]
          : url.split('/').pop();
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=${showControls ? 1 : 0}`;
      }
      if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop();
        return `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}`;
      }
      return url; // Return as is if not recognized (maybe already embed url)
    } catch (e) {
      return url;
    }
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative w-full pb-[56.25%] bg-black rounded-xl overflow-hidden shadow-lg">
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Product Video"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductVideo;
