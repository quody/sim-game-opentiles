import { promises as fs } from 'fs';
import path from 'path';
import { parseGraph } from '@/lib/graphParser';
import TechTreeViewer from '@/components/TechTreeViewer';

export default async function TechTreePage() {
  // Read the graph.md file from the project root
  const graphPath = path.join(process.cwd(), 'graph.md');
  const graphContent = await fs.readFile(graphPath, 'utf-8');

  // Parse the graph data
  const graphData = parseGraph(graphContent);

  return (
    <div className="w-full h-screen">
      <TechTreeViewer graphData={graphData} />
    </div>
  );
}
