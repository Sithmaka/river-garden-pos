import { useEffect, useState } from 'react';
import riverGardenLogo from '../../assets/logo1.png';

export default function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-cyan-50 to-teal-50 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center animate-fade-in">
        <img 
          src={riverGardenLogo} 
          alt="River Garden Resort" 
          className="h-48 mb-4 animate-pulse"
        />
        <div className="h-1 w-32 bg-teal-500 rounded-full mt-2"></div>
      </div>
    </div>
  );
}
