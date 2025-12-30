import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parseAtlas } from '@/lib/atlasParser';

export async function GET() {
  try {
    const atlasPath = join(process.cwd(), 'Dawnlike4.atlas');
    const content = await readFile(atlasPath, 'utf-8');
    const atlasData = parseAtlas(content);

    return NextResponse.json(atlasData);
  } catch (error) {
    console.error('Error parsing atlas:', error);
    return NextResponse.json(
      { error: 'Failed to parse atlas file' },
      { status: 500 }
    );
  }
}
