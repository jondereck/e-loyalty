import { scanCustomerQr } from "@/lib/services/visits";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      qrToken?: string;
      branchId?: string;
      suspicious?: boolean;
    };

    if (!body.qrToken) {
      return Response.json({ error: "QR token is required." }, { status: 400 });
    }

    const result = await scanCustomerQr({
      qrToken: body.qrToken,
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

