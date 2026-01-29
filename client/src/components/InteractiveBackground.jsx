import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './InteractiveBackground.css';

const InteractiveBackground = () => {
  const { theme, liveBackgroundEnabled } = useTheme();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (theme !== 'dark' || !liveBackgroundEnabled) return null;

  return (
    <div 
      className="interactive-spotlight"
      style={{
        background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.15), transparent 40%)`
      }}
    />
  );
};

export default InteractiveBackground;
