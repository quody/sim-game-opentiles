import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';

export interface Node {
  id: string;
  label: string;
  className: string;
  group?: string;
}

export interface Edge {
  from: string;
  to: string;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  groups: Map<string, string[]>;
}

export function parseGraph(graphContent: string): GraphData {
  const lines = graphContent.split('\n');
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const groups = new Map<string, string[]>();
  const nodeMap = new Map<string, Node>();

  let currentGroup: string | undefined;
  let inSubgraph = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments, empty lines, and style definitions
    if (!line || line.startsWith('%%') || line.startsWith('classDef') ||
        line.startsWith('flowchart') || line.startsWith('direction') ||
        line.startsWith('```')) {
      continue;
    }

    // Handle subgraph start
    if (line.startsWith('subgraph ')) {
      const match = line.match(/subgraph\s+(\w+)\["([^"]+)"\]/) ||
                    line.match(/subgraph\s+(\w+)\[([^\]]+)\]/) ||
                    line.match(/subgraph\s+(\w+)/);
      if (match) {
        currentGroup = match[2] || match[1];
        inSubgraph = true;
      }
      continue;
    }

    // Handle subgraph end
    if (line === 'end') {
      inSubgraph = false;
      currentGroup = undefined;
      continue;
    }

    // Parse node definitions (e.g., IronOre[Iron Ore]:::resource)
    const nodeMatch = line.match(/^(\w+)\[([^\]]+)\]:::(\w+)/);
    if (nodeMatch) {
      const [, id, label, className] = nodeMatch;
      const node: Node = {
        id,
        label,
        className,
        group: currentGroup,
      };
      nodes.push(node);
      nodeMap.set(id, node);

      if (currentGroup) {
        if (!groups.has(currentGroup)) {
          groups.set(currentGroup, []);
        }
        groups.get(currentGroup)!.push(id);
      }
      continue;
    }

    // Parse edges (e.g., IronOre --> Bloomery --> IronBloom)
    // This handles chains like A --> B --> C as well as simple A --> B
    if (line.includes('-->')) {
      const parts = line.split('-->').map(p => p.trim());

      for (let j = 0; j < parts.length - 1; j++) {
        const from = parts[j];
        const to = parts[j + 1];

        if (from && to) {
          edges.push({ from, to });
        }
      }
      continue;
    }
  }

  return { nodes, edges, groups };
}

export function getNodeColor(className: string): string {
  const colorMap: Record<string, string> = {
    resource: '#4a7c59',
    processing: '#c17f59',
    tool: '#4a6fa5',
    facility: '#8b6914',
    hobbit: '#7cb342',
    dwarf: '#78909c',
    men: '#ab7b4a',
  };

  return colorMap[className] || '#666666';
}

export function getNodesByGroup(graphData: GraphData, group: string): Node[] {
  const nodeIds = graphData.groups.get(group) || [];
  return nodeIds.map(id => graphData.nodes.find(n => n.id === id)!).filter(Boolean);
}

export function getIncomingEdges(graphData: GraphData, nodeId: string): Edge[] {
  return graphData.edges.filter(e => e.to === nodeId);
}

export function getOutgoingEdges(graphData: GraphData, nodeId: string): Edge[] {
  return graphData.edges.filter(e => e.from === nodeId);
}

function calculateNodeDepth(graphData: GraphData): Map<string, number> {
  const depths = new Map<string, number>();
  const inDegree = new Map<string, number>();

  // Initialize in-degree for all nodes
  graphData.nodes.forEach(node => {
    inDegree.set(node.id, 0);
  });

  // Calculate in-degrees
  graphData.edges.forEach(edge => {
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
  });

  // Find nodes with no incoming edges (level 0 - raw resources/precursors)
  const queue: { id: string; depth: number }[] = [];
  graphData.nodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push({ id: node.id, depth: 0 });
      depths.set(node.id, 0);
    }
  });

  // BFS to calculate depths
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;

    if (visited.has(id)) continue;
    visited.add(id);

    // Find all outgoing edges
    const outgoingEdges = graphData.edges.filter(e => e.from === id);

    outgoingEdges.forEach(edge => {
      const targetDepth = depths.get(edge.to) ?? -1;
      const newDepth = depth + 1;

      // Update depth if this path is longer
      if (newDepth > targetDepth) {
        depths.set(edge.to, newDepth);
      }

      // Add to queue if not visited
      if (!visited.has(edge.to)) {
        queue.push({ id: edge.to, depth: newDepth });
      }
    });
  }

  // Handle any remaining nodes (disconnected components)
  graphData.nodes.forEach(node => {
    if (!depths.has(node.id)) {
      depths.set(node.id, 0);
    }
  });

  return depths;
}

export async function convertToReactFlow(graphData: GraphData): Promise<{
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}> {
  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 70;
  const HORIZONTAL_SPACING = 250; // Space between columns
  const VERTICAL_SPACING = 90;    // Space between nodes in same column

  // Calculate depth for each node
  const nodeDepths = calculateNodeDepth(graphData);

  // Group nodes by depth
  const nodesByDepth = new Map<number, Node[]>();
  graphData.nodes.forEach(node => {
    const depth = nodeDepths.get(node.id) ?? 0;
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth)!.push(node);
  });

  // Sort nodes within each depth by their className for better grouping
  nodesByDepth.forEach((nodes) => {
    nodes.sort((a, b) => {
      // First sort by className
      if (a.className !== b.className) {
        return a.className.localeCompare(b.className);
      }
      // Then by label
      return a.label.localeCompare(b.label);
    });
  });

  // Calculate positions for each node
  const nodePositions = new Map<string, { x: number; y: number }>();

  nodesByDepth.forEach((nodes, depth) => {
    const columnX = depth * HORIZONTAL_SPACING;

    nodes.forEach((node, index) => {
      nodePositions.set(node.id, {
        x: columnX,
        y: index * VERTICAL_SPACING,
      });
    });
  });

  // Convert to React Flow nodes
  const reactFlowNodes: ReactFlowNode[] = graphData.nodes.map(node => {
    const position = nodePositions.get(node.id) ?? { x: 0, y: 0 };
    return {
      id: node.id,
      type: 'techNode',
      position,
      data: {
        label: node.label,
        className: node.className,
        group: node.group,
        depth: nodeDepths.get(node.id) ?? 0,
      },
    };
  });

  // Convert to React Flow edges with orthogonal routing
  const reactFlowEdges: ReactFlowEdge[] = graphData.edges.map((edge, index) => ({
    id: `${edge.from}-${edge.to}-${index}`,
    source: edge.from,
    target: edge.to,
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: '#666',
      strokeWidth: 2,
    },
  }));

  return { nodes: reactFlowNodes, edges: reactFlowEdges };
}
