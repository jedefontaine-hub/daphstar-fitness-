import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'designer');

function isSafeName(name: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

function parseAuthHeader(request: Request): string | null {
  return (
    request.headers.get('x-designer-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    null
  );
}

function authFailed(request: Request): NextResponse | null {
  const expectedKey = process.env.DESIGNER_API_KEY;
  if (!expectedKey) return null;
  const provided = parseAuthHeader(request);
  if (!provided || provided !== expectedKey) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const unauthorized = authFailed(request);
    if (unauthorized) return unauthorized;

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });

    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const fullPath = path.join(UPLOAD_DIR, entry.name);
          const stat = await fs.stat(fullPath);
          return {
            name: entry.name,
            url: `/uploads/designer/${entry.name}`,
            size: stat.size,
            updatedAt: stat.mtime.toISOString()
          };
        })
    );

    files.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return NextResponse.json({ ok: true, files });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const unauthorized = authFailed(request);
    if (unauthorized) return unauthorized;

    const url = new URL(request.url);
    const name = url.searchParams.get('name') || '';
    if (!name || !isSafeName(name)) {
      return NextResponse.json({ ok: false, error: 'Invalid asset name' }, { status: 400 });
    }

    const fullPath = path.join(UPLOAD_DIR, name);
    await fs.unlink(fullPath);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = authFailed(request);
    if (unauthorized) return unauthorized;

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Missing file' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: 'Unsupported file type' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = (file.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}-${safeName}`;

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const fullPath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(fullPath, buffer);

    return NextResponse.json({
      ok: true,
      url: `/uploads/designer/${filename}`,
      name: filename,
      type: file.type,
      size: file.size
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
