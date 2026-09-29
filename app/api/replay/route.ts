import { NextResponse } from 'next/server';
import { executeDeterministicReplay } from '@/lib/crawler/replay-runner';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const anomalyId = body.anomalyId || 'anom_500_1';
    const anomaly = body.anomaly;
    const breadcrumbs = body.breadcrumbs;

    // Extract base URL from request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const steps = await executeDeterministicReplay({
      anomalyId,
      anomaly,
      breadcrumbs,
      baseUrl,
    });

    return NextResponse.json({
      anomalyId,
      steps,
      totalSteps: steps.length,
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Replay runner execution failed: ' + (err?.message || err) },
      { status: 500 }
    );
  }
}
