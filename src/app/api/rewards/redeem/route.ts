import { redeemReward } from "@/lib/services/rewards";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { milestoneId?: string; qrToken?: string };
    if (!body.milestoneId) return Response.json({ error: "Reward is required." }, { status: 400 });

    const redemption = await redeemReward(body.milestoneId, body.qrToken);
    return Response.json({ id: redemption.id, status: redemption.status });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Reward redemption failed." },
      { status: 400 },
    );
  }
}
