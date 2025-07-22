import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { SiteConfig } from '@/config/site';

const CONFIG_DIR = join(process.cwd(), 'data');
const CONFIG_FILE = join(CONFIG_DIR, 'site-config.json');

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
}

// GET: Load configuration
export async function GET() {
  try {
    await ensureDataDir();
    
    if (existsSync(CONFIG_FILE)) {
      const data = await readFile(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(data);
      return NextResponse.json(config);
    }
    
    // Return null if no config file exists (will use defaults)
    return NextResponse.json(null);
  } catch (error) {
    console.error('Error loading config:', error);
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
  }
}

// POST: Save configuration
export async function POST(request: NextRequest) {
  try {
    const config: SiteConfig = await request.json();
    
    await ensureDataDir();
    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}

// DELETE: Reset configuration (delete file)
export async function DELETE() {
  try {
    if (existsSync(CONFIG_FILE)) {
      const { unlink } = await import('fs/promises');
      await unlink(CONFIG_FILE);
    }
    
    return NextResponse.json({ success: true, message: 'Configuration reset successfully' });
  } catch (error) {
    console.error('Error resetting config:', error);
    return NextResponse.json({ error: 'Failed to reset configuration' }, { status: 500 });
  }
}
