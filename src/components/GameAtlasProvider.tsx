'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadAtlas, type LoadedAtlas } from '@/lib/spriteLoader';

interface GameAtlasContextType {
  atlas: LoadedAtlas | null;
  loading: boolean;
  error: string | null;
}

const GameAtlasContext = createContext<GameAtlasContextType>({
  atlas: null,
  loading: true,
  error: null,
});

export function useGameAtlas() {
  return useContext(GameAtlasContext);
}

interface GameAtlasProviderProps {
  children: ReactNode;
  atlasPath?: string;
  imagePath?: string;
}

export function GameAtlasProvider({
  children,
  atlasPath = '/custom_sprites.atlas',
  imagePath = '/Dawnlike4.png',
}: GameAtlasProviderProps) {
  const [atlas, setAtlas] = useState<LoadedAtlas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAtlas(atlasPath, imagePath)
      .then((loaded) => {
        setAtlas(loaded);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load atlas:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [atlasPath, imagePath]);

  return (
    <GameAtlasContext.Provider value={{ atlas, loading, error }}>
      {children}
    </GameAtlasContext.Provider>
  );
}
