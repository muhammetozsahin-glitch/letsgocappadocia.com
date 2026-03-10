import { memo } from 'react';
import { useInView } from 'react-intersection-observer';

export const HeroSection = memo(() => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div className="relative hidden overflow-hidden rounded-r-[32px] bg-slate-100 lg:block lg:w-[55%] xl:w-[60%] dark:bg-slate-900">
      <div ref={ref} className="absolute inset-0 h-full w-full transition-opacity duration-700" style={{ opacity: inView ? 1 : 0 }}>
        {inView ? (
          <>
            <img
              src="https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dcf363ec-bac4-4f85-8e2e-6f520d316a07.jpg"
              alt="Cappadocia Balloons"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-transparent" />

            <div className="absolute bottom-10 left-10 right-10 space-y-4 text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-sky-300" />
                Yapay zeka destekli planlama
              </div>
              <h2 className="text-4xl font-semibold leading-tight xl:text-5xl">
                Kapadokya’da daha temiz,
                <br />
                daha akıllı bir gezi planı oluşturun.
              </h2>
              <p className="max-w-xl text-base leading-7 text-white/78 xl:text-lg">
                OpenAI ve Google Maps destekli önerilerle rotanızı oluşturun, günlerinizi düzenleyin ve tüm detayları tek panelde yönetin.
              </p>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/5">
            <span className="text-xl font-semibold text-primary/80">Kapadokya</span>
          </div>
        )}
      </div>
    </div>
  );
});

HeroSection.displayName = 'HeroSection';
