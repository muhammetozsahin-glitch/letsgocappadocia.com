import { memo } from 'react';
import { useInView } from 'react-intersection-observer';

export const HeroSection = memo(() => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div className="hidden lg:block lg:w-[55%] xl:w-[60%] relative overflow-hidden bg-gray-100">
      <div 
        ref={ref}
        className="absolute inset-0 w-full h-full transition-opacity duration-1000"
        style={{ opacity: inView ? 1 : 0 }}
      >
        {inView && (
          <>
            <img 
              src="https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dcf363ec-bac4-4f85-8e2e-6f520d316a07.jpg" 
              alt="Cappadocia Balloons" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Overlay Content */}
            <div className="absolute bottom-12 left-12 right-12 text-white space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-sm font-medium">Yapay Zeka Destekli Planlama</span>
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
                Peri bacalarının kalbinde <br /> 
                <span className="text-orange-400">unutulmaz bir hikaye</span> yazın.
              </h2>
              <p className="text-lg text-white/80 max-w-xl">
                OpenAI ve Google Maps altyapısıyla hazırlanan akıllı rotalarımızla, Kapadokya'nın her köşesini bir yerli gibi keşfedin.
              </p>
            </div>
          </>
        )}
        
        {!inView && (
          <div className="w-full h-full bg-orange-50 animate-pulse flex items-center justify-center">
            <span className="text-orange-200 font-bold text-2xl">Kapadokya</span>
          </div>
        )}
      </div>
    </div>
  );
});

HeroSection.displayName = 'HeroSection';
