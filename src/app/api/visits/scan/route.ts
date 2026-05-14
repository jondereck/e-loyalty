import { scanCustomerQr } from "@/lib/services/visits";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      scanCode?: string;
      qrToken?: string;
      branchId?: string;
      suspicious?: boolean;
    };

    const scanCode = (body.scanCode ?? body.qrToken)?.trim();
    if (!scanCode) {
      return Response.json({ error: "QR token or card number is required." }, { status: 400 });
    }

    const result = await scanCustomerQr({
      scanCode,
      branchId: body.branchId,
      suspicious: body.suspicious,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Scan failed." },
      { status: 400 },
    );
  }
}

