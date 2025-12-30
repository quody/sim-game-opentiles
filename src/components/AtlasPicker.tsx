'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { AtlasData, SpriteRegion } from '@/lib/atlasParser';
import { getUniqueSpriteNames, getRegionsByName, generateAtlas, parseAtlas } from '@/lib/atlasParser';

interface SpritePreviewProps {
  region: SpriteRegion;
  atlasSize: { width: number; height: number };
  scale?: number;
}

function SpritePreview({ region, atlasSize, scale = 1 }: SpritePreviewProps) {
  const { bounds } = region;

  return (
    <div
      className="relative overflow-hidden bg-zinc-800"
      style={{
        width: bounds.width * scale,
        height: bounds.height * scale,
      }}
    >
      <div
        className="absolute"
        style={{
          width: atlasSize.width * scale,
          height: atlasSize.height * scale,
          backgroundImage: 'url(/Dawnlike4.png)',
          backgroundSize: `${atlasSize.width * scale}px ${atlasSize.height * scale}px`,
          imageRendering: 'pixelated',
          left: -bounds.x * scale,
          top: -bounds.y * scale,
        }}
      />
    </div>
  );
}

interface SpriteListItemProps {
  name: string;
  regions: SpriteRegion[];
  atlasSize: { width: number; height: number };
  isSelected: boolean;
  onToggle: () => void;
}

function SpriteListItem({ name, regions, atlasSize, isSelected, onToggle }: SpriteListItemProps) {
  const firstRegion = regions[0];
  const hasAnimation = regions.length > 1;
  const [animFrame, setAnimFrame] = useState(0);

  useEffect(() => {
    if (!hasAnimation) return;
    const interval = setInterval(() => {
      setAnimFrame((f) => (f + 1) % regions.length);
    }, 300);
    return () => clearInterval(interval);
  }, [hasAnimation, regions.length]);

  const displayRegion = hasAnimation ? regions[animFrame] : firstRegion;

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-900/50 border border-blue-500' : 'hover:bg-zinc-800 border border-transparent'
      }`}
      onClick={onToggle}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 accent-blue-500"
      />
      <SpritePreview region={displayRegion} atlasSize={atlasSize} scale={2} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-200 truncate">{name}</div>
        <div className="text-xs text-zinc-500">
          {firstRegion.bounds.width}x{firstRegion.bounds.height}
          {hasAnimation && ` • ${regions.length} frames`}
        </div>
      </div>
    </div>
  );
}

export default function AtlasPicker() {
  const [atlasData, setAtlasData] = useState<AtlasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [exportName, setExportName] = useState('custom_sprites');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/atlas')
      .then((res) => res.json())
      .then((data) => {
        setAtlasData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const uniqueNames = useMemo(() => {
    if (!atlasData) return [];
    return getUniqueSpriteNames(atlasData.regions);
  }, [atlasData]);

  const filteredNames = useMemo(() => {
    if (!searchQuery.trim()) return uniqueNames;
    const query = searchQuery.toLowerCase();
    return uniqueNames.filter((name) => name.toLowerCase().includes(query));
  }, [uniqueNames, searchQuery]);

  const selectedRegions = useMemo(() => {
    if (!atlasData) return [];
    const regions: SpriteRegion[] = [];
    for (const name of selectedNames) {
      regions.push(...getRegionsByName(atlasData.regions, name));
    }
    return regions;
  }, [atlasData, selectedNames]);

  const toggleSprite = useCallback((name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedNames(new Set(filteredNames));
  }, [filteredNames]);

  const selectNone = useCallback(() => {
    setSelectedNames(new Set());
  }, []);

  const exportAtlas = useCallback(() => {
    if (!atlasData || selectedRegions.length === 0) return;

    const atlasContent = generateAtlas(atlasData, selectedRegions, `${exportName}.png`);
    const blob = new Blob([atlasContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportName}.atlas`;
    a.click();
    URL.revokeObjectURL(url);
  }, [atlasData, selectedRegions, exportName]);

  const exportSpriteList = useCallback(() => {
    if (selectedRegions.length === 0) return;

    const names = [...selectedNames].sort().join('\n');
    const blob = new Blob([names], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportName}_list.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedNames, selectedRegions.length, exportName]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      let namesToSelect: string[] = [];

      if (file.name.endsWith('.atlas')) {
        // Parse atlas file and extract sprite names
        try {
          const importedAtlas = parseAtlas(content);
          namesToSelect = getUniqueSpriteNames(importedAtlas.regions);
        } catch (err) {
          console.error('Failed to parse atlas file:', err);
          alert('Failed to parse atlas file');
          return;
        }
      } else {
        // Assume it's a text file with sprite names (one per line)
        namesToSelect = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      }

      // Add imported names to selection (merge with existing)
      setSelectedNames(prev => {
        const next = new Set(prev);
        for (const name of namesToSelect) {
          if (uniqueNames.includes(name)) {
            next.add(name);
          }
        }
        return next;
      });

      // Reset file input so the same file can be imported again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  }, [uniqueNames]);

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">
        Loading atlas data...
      </div>
    );
  }

  if (error || !atlasData) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-red-400">
        Error: {error || 'Failed to load atlas'}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Left Panel - Sprite List */}
      <div className="w-80 flex flex-col border-r border-zinc-800">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-lg font-semibold mb-3">Atlas Picker</h1>
          <input
            type="text"
            placeholder="Search sprites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={selectAll}
              className="flex-1 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              Select All
            </button>
            <button
              onClick={selectNone}
              className="flex-1 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              Select None
            </button>
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {filteredNames.length} sprites • {selectedNames.size} selected
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNames.map((name) => (
            <SpriteListItem
              key={name}
              name={name}
              regions={getRegionsByName(atlasData.regions, name)}
              atlasSize={atlasData.size}
              isSelected={selectedNames.has(name)}
              onToggle={() => toggleSprite(name)}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Preview & Export */}
      <div className="flex-1 flex flex-col">
        {/* Export Controls */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-4 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".atlas,.txt"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={triggerImport}
            className="px-4 py-1.5 bg-green-700 hover:bg-green-600 rounded text-sm font-medium transition-colors"
          >
            Import
          </button>
          <div className="w-px h-6 bg-zinc-700" />
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">Export name:</label>
            <input
              type="text"
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm focus:outline-none focus:border-blue-500 w-48"
            />
          </div>
          <button
            onClick={exportAtlas}
            disabled={selectedRegions.length === 0}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded text-sm font-medium transition-colors"
          >
            Export .atlas
          </button>
          <button
            onClick={exportSpriteList}
            disabled={selectedNames.size === 0}
            className="px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500 rounded text-sm transition-colors"
          >
            Export List
          </button>
          <div className="text-sm text-zinc-500">
            {selectedRegions.length} regions selected
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-4">
          {selectedRegions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-600">
              Select sprites from the list to preview
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {[...selectedNames].sort().map((name) => {
                const regions = getRegionsByName(atlasData.regions, name);
                return (
                  <div
                    key={name}
                    className="flex flex-col items-center gap-2 p-3 bg-zinc-900 rounded-lg"
                  >
                    <div className="flex gap-1">
                      {regions.map((region, i) => (
                        <SpritePreview
                          key={`${region.name}-${region.index}-${i}`}
                          region={region}
                          atlasSize={atlasData.size}
                          scale={2}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-zinc-400 max-w-24 truncate text-center" title={name}>
                      {name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
