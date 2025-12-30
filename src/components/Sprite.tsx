'use client';

import { useState, useEffect } from 'react';
import type { LoadedAtlas, SpriteData } from '@/lib/spriteLoader';
import { getSprite, getSpriteFrame } from '@/lib/spriteLoader';

// Default sprite size (downscaled from 64x64 to 32x32)
const SPRITE_SIZE = 32;
const ORIGINAL_SIZE = 64;
const SCALE = SPRITE_SIZE / ORIGINAL_SIZE; // 0.5

interface SpriteProps {
  atlas: LoadedAtlas;
  name: string;
  size?: number;
  animate?: boolean;
  animationSpeed?: number; // ms per frame
  frame?: number; // manual frame control (ignored if animate=true)
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Sprite({
  atlas,
  name,
  size = SPRITE_SIZE,
  animate = true,
  animationSpeed = 300,
  frame = 0,
  className = '',
  style = {},
  onClick,
}: SpriteProps) {
  const [currentFrame, setCurrentFrame] = useState(frame);
  const sprite = getSprite(atlas, name);

  useEffect(() => {
    if (!sprite || !animate || !sprite.isAnimated) return;

    const interval = setInterval(() => {
      setCurrentFrame((f) => (f + 1) % sprite.frames.length);
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [sprite, animate, animationSpeed]);

  useEffect(() => {
    if (!animate) {
      setCurrentFrame(frame);
    }
  }, [frame, animate]);

  if (!sprite) {
    return (
      <div
        className={`bg-red-900 ${className}`}
        style={{ width: size, height: size, ...style }}
        title={`Sprite not found: ${name}`}
      />
    );
  }

  const region = getSpriteFrame(sprite, currentFrame);
  const scale = size / ORIGINAL_SIZE;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      onClick={onClick}
      title={name}
    >
      <div
        className="absolute"
        style={{
          width: atlas.data.size.width * scale,
          height: atlas.data.size.height * scale,
          backgroundImage: `url(${atlas.imagePath})`,
          backgroundSize: `${atlas.data.size.width * scale}px ${atlas.data.size.height * scale}px`,
          imageRendering: 'pixelated',
          left: -region.bounds.x * scale,
          top: -region.bounds.y * scale,
        }}
      />
    </div>
  );
}

interface AnimatedSpriteProps extends Omit<SpriteProps, 'animate'> {}

export function AnimatedSprite(props: AnimatedSpriteProps) {
  return <Sprite {...props} animate={true} />;
}

interface StaticSpriteProps extends Omit<SpriteProps, 'animate' | 'animationSpeed'> {}

export function StaticSprite(props: StaticSpriteProps) {
  return <Sprite {...props} animate={false} />;
}
