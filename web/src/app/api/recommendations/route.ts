import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp profileId" },
        { status: 400 }
      );
    }

    const recs = await prisma.recommendationLog.findMany({
      where: { systemProfileId: profileId },
      orderBy: { createdAt: "asc" },
    });

    const parsed = recs.map((r) => ({
      ...r,
      steps: JSON.parse(r.steps || "[]"),
    }));

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Lỗi khi nạp danh sách khuyến nghị:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải khuyến nghị" },
      { status: 500 }
    );
  }
}
