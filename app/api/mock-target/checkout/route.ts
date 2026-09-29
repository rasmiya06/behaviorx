import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const postalCode = body.postalCode || body.postal_code || '';

    // Bug 3: Trigger intentional 500 error on blank or '00000' postal code
    if (!postalCode || postalCode.trim() === '' || postalCode.trim() === '00000') {
      return NextResponse.json(
        {
          error: "Database transaction deadlocked on null postal_code",
          code: "ERR_DB_DEADLOCK_POSTAL",
          timestamp: new Date().toISOString(),
          table: "orders_fulfillment_v2"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: "ORD-" + Math.floor(100000 + Math.random() * 900000),
      message: "Order placed successfully"
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal processing error: " + err.message },
      { status: 500 }
    );
  }
}
