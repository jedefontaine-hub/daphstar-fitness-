import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const file = path.join(process.cwd(), 'specs', 'walkthrough.json');
    const data = await fs.readFile(file, 'utf8');
    const json = JSON.parse(data);
    return NextResponse.json({ ok: true, data: json });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 404 });
  }
}

export async function POST(request: Request) {
  try {
    // API key guard (optional)
    const expectedKey = process.env.DESIGNER_API_KEY;
    if (expectedKey) {
      const provided = request.headers.get('x-designer-key') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
      if (!provided || provided !== expectedKey) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    if (!body || !Array.isArray(body.steps)) {
      return NextResponse.json({ ok: false, error: 'Invalid payload, expected { steps: [...] }' }, { status: 400 });
    }

    const file = path.join(process.cwd(), 'specs', 'walkthrough.json');
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(body, null, 2), 'utf8');

    return NextResponse.json({ ok: true, path: '/specs/walkthrough.json' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
