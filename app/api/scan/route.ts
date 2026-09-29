import { NextResponse } from 'next/server';
import { runCrawl } from '@/lib/crawler/crawler-engine';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetUrl = (body.targetUrl || '').trim();
    const auth = body.auth;

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Target URL is required. Please enter any web application or website URL to scan.' },
        { status: 400 }
      );
    }

    // Extract base URL from request headers if available
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const report = await runCrawl({
      targetUrl,
      baseUrl,
      auth,
    });

    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Crawler execution failed' },
      { status: 500 }
    );
  }
}
