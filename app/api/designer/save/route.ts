import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Simple API-key auth: if DESIGNER_API_KEY is set, require it in the request
    const expectedKey = process.env.DESIGNER_API_KEY;
    if (expectedKey) {
      const provided = request.headers.get('x-designer-key') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
      if (!provided || provided !== expectedKey) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
    }
    if (!body || !body.meta || !body.components) {
      return NextResponse.json({ ok: false, error: 'Invalid design payload' }, { status: 400 });
    }

    const name = (body.meta && body.meta.name) ? String(body.meta.name).replace(/[^a-z0-9-_]/gi, '_') : 'design';
    const filename = `${name}-${Date.now()}.json`;
    const specsDir = path.join(process.cwd(), 'specs');
    await fs.mkdir(specsDir, { recursive: true });
    const filePath = path.join(specsDir, filename);
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf8');

    return NextResponse.json({ ok: true, path: `/specs/${filename}` });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
