import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profileId = params.id;

    const profile = await prisma.systemProfile.findUnique({
      where: { id: profileId },
      include: {
        benchmarkResult: true,
        fpsRecords: true,
        recommendations: {
          orderBy: [
            { impact: "asc" }, // High first if formatted or sorted in UI
            { createdAt: "desc" },
          ],
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy hồ sơ máy tính này" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin hồ sơ:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải dữ liệu hồ sơ" },
      { status: 500 }
    );
  }
}
