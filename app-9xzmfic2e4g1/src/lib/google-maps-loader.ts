let isInitialized = false;

export const initGoogleMaps = async (apiKey: string) => {
  if (isInitialized) return;
  
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&language=tr&region=TR`;
  script.async = true;
  script.defer = true;
  
  return new Promise<void>((resolve, reject) => {
    script.onload = () => {
      isInitialized = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};