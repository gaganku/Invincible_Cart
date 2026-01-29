import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './SakuraBackground.css';

const SakuraBackground = () => {
  const { theme, liveBackgroundEnabled } = useTheme();
  const [particles, setParticles] = useState([]);
  const requestRef = useRef();
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef([]);

  // Initialize particles
  useEffect(() => {
    if (theme !== 'dark' || !liveBackgroundEnabled) {
      setParticles([]);
      particlesRef.current = [];
      return;
    }

    const particleCount = 60;
    const newParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push(createParticle(i));
    }
    
    particlesRef.current = newParticles;
    setParticles(newParticles);

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      updateParticles();
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, [theme]);

  const createParticle = (id) => {
    return {
      id,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 5 + 5, // 5-10px (Smaller)
      speedY: Math.random() * 1 + 0.5, // Falling speed
      speedX: Math.random() * 0.5 - 0.25, // Slight drift
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 2 - 1,
      vx: 0, // Velocity X (for interaction)
      vy: 0, // Velocity Y (for interaction)
    };
  };

  const updateParticles = () => {
    const interactionRadius = 150;
    const repulsionStrength = 0.5;
    const friction = 0.95;

    particlesRef.current.forEach(p => {
      // 1. Basic Movement (Falling)
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      // 2. Mouse Interaction (Repulsion)
      const dx = p.x - mouseRef.current.x;
      const dy = p.y - mouseRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < interactionRadius) {
        const force = (interactionRadius - distance) / interactionRadius;
        const angle = Math.atan2(dy, dx);
        
        // Push away
        p.vx += Math.cos(angle) * force * repulsionStrength;
        p.vy += Math.sin(angle) * force * repulsionStrength;
      }

      // Apply velocity from interaction
      p.x += p.vx;
      p.y += p.vy;

      // Friction (slow down the push effect)
      p.vx *= friction;
      p.vy *= friction;

      // 3. Reset if out of bounds
      if (p.y > window.innerHeight + 50) {
        p.y = -50;
        p.x = Math.random() * window.innerWidth;
        p.vx = 0;
        p.vy = 0;
      }
      if (p.x > window.innerWidth + 50) p.x = -50;
      if (p.x < -50) p.x = window.innerWidth + 50;
    });

    // Trigger re-render
    // Note: For high performance with many particles, using a Canvas is better.
    // But for < 100 DOM nodes, React state update might be okay if optimized, 
    // or we can use refs to update DOM directly to avoid React render cycle overhead.
    // Let's try direct DOM update for performance if possible, or just state for simplicity first.
    // Actually, setting state 60fps might be heavy. Let's use a forceUpdate or ref-based approach.
    // For simplicity in this context, let's stick to state but maybe throttle or accept high CPU.
    // BETTER: Update the DOM elements directly via refs to avoid React reconciliation.
    
    // We will use the 'particles' state just for initial render, and update positions manually.
    particlesRef.current.forEach(p => {
        const el = document.getElementById(`particle-${p.id}`);
        if (el) {
            el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
        }
    });
  };

  if (theme !== 'dark' || !liveBackgroundEnabled) return null;

  return (
    <div className="sakura-container">
      {particles.map((p) => (
        <div
          key={p.id}
          id={`particle-${p.id}`}
          className="heart-particle"
          style={{
            width: p.size,
            height: p.size,
            // Initial position, updated by JS loop
            transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

export default SakuraBackground;
