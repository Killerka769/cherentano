'use client';

import { useEffect, useState } from 'react';
import styles from './Particles.module.scss';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocityX: number;
  velocityY: number;
  opacity: number;
}

interface ParticlesProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

export default function Particles({ x, y, onComplete }: ParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = ['#c4492c', '#f4a261', '#ff9800', '#e91e63', '#4caf50', '#ffd700'];
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x: x - 20 + Math.random() * 40,
        y: y - 20 + Math.random() * 40,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocityX: (Math.random() - 0.5) * 8,
        velocityY: (Math.random() - 0.5) * 8 - 5,
        opacity: 1,
      });
    }
    
    setParticles(newParticles);
    
    const animate = () => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.velocityX,
        y: p.y + p.velocityY,
        velocityY: p.velocityY + 0.3,
        opacity: p.opacity - 0.02,
      })).filter(p => p.opacity > 0));
    };
    
    const interval = setInterval(animate, 16);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      onComplete?.();
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [x, y]);

  return (
    <div className={styles.container}>
      {particles.map(p => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}