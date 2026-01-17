'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { GraphData, convertToReactFlow, getNodeColor } from '@/lib/graphParser';
import TechNode from './TechNode';

interface TechTreeViewerProps {
  graphData: GraphData;
}

const nodeTypes = {
  techNode: TechNode,
};

export default function TechTreeViewer({ graphData }: TechTreeViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLayout = async () => {
      setIsLoading(true);
      const { nodes: layoutNodes, edges: layoutEdges } = await convertToReactFlow(graphData);
      setNodes(layoutNodes);
      setEdges(layoutEdges);
      setIsLoading(false);
    };
    loadLayout();
  }, [graphData, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Highlight connected edges
      setEdges((eds) =>
        eds.map((edge) => {
          const isConnected =
            edge.source === node.id || edge.target === node.id;
          return {
            ...edge,
            animated: isConnected,
            style: {
              ...edge.style,
              stroke: isConnected ? '#fbbf24' : '#666',
              strokeWidth: isConnected ? 3 : 2,
            },
          };
        })
      );
    },
    [setEdges]
  );

  const onPaneClick = useCallback(() => {
    // Reset edge highlighting
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: false,
        style: {
          ...edge.style,
          stroke: '#666',
          strokeWidth: 2,
        },
      }))
    );
  }, [setEdges]);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading tech tree layout...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background color="#333" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { className: string };
            return getNodeColor(data.className);
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
          style={{
            backgroundColor: '#18181b',
          }}
        />
        <Panel position="top-left" className="bg-zinc-900 p-4 rounded-lg border border-zinc-700">
          <h2 className="text-white text-lg font-bold mb-2">Tech Tree</h2>
          <div className="text-zinc-400 text-sm space-y-1">
            <p>Nodes: {graphData.nodes.length}</p>
            <p>Connections: {graphData.edges.length}</p>
          </div>
          <div className="mt-4 space-y-2 text-xs text-zinc-400">
            <p>🖱️ Scroll to zoom</p>
            <p>🖱️ Drag to pan</p>
            <p>🖱️ Click node to highlight</p>
            <p>🖱️ Drag nodes to reposition</p>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-zinc-500 text-xs mb-2">Legend:</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getNodeColor('resource') }}></div>
              <span className="text-zinc-400 text-xs">Resource</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getNodeColor('processing') }}></div>
              <span className="text-zinc-400 text-xs">Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getNodeColor('tool') }}></div>
              <span className="text-zinc-400 text-xs">Tool</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getNodeColor('facility') }}></div>
              <span className="text-zinc-400 text-xs">Facility</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getNodeColor('hobbit') }}></div>
              <span className="text-zinc-400 text-xs">Hobbit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getNodeColor('dwarf') }}></div>
              <span className="text-zinc-400 text-xs">Dwarf</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getNodeColor('men') }}></div>
              <span className="text-zinc-400 text-xs">Men</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
