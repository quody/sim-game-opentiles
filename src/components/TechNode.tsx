'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { getNodeColor } from '@/lib/graphParser';

interface TechNodeData {
  label: string;
  className: string;
  group?: string;
  depth?: number;
}

function TechNode({ data, selected }: NodeProps<TechNodeData>) {
  const color = getNodeColor(data.className);

  return (
    <div
      className="px-4 py-3 rounded-lg shadow-lg border-2 transition-all"
      style={{
        backgroundColor: color,
        borderColor: selected ? '#fbbf24' : '#333',
        minWidth: '180px',
        minHeight: '60px',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: 8,
          height: 8,
        }}
      />
      <div className="text-white text-sm font-medium text-center">
        {data.label}
      </div>
      <div className="flex justify-center gap-2 mt-1">
        {data.depth !== undefined && (
          <div className="text-xs text-white/50 text-center">
            L{data.depth}
          </div>
        )}
        {data.group && (
          <div className="text-xs text-white/70 text-center">
            {data.group}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#555',
          width: 8,
          height: 8,
        }}
      />
    </div>
  );
}

export default memo(TechNode);
