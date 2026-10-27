import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.toUpperCase().trim();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Mã liên kết phải gồm 6 ký tự hợp lệ" },
        { status: 400 }
      );
    }

    const session = await prisma.linkSession.findUnique({
      where: { code },
      include: {
        systemProfile: {
          select: {
            id: true,
            cpuName: true,
            gpuName: true,
            ramTotalGb: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy mã liên kết này" },
        { status: 404 }
      );
    }

    // Kiểm tra hết hạn
    const isExpired = new Date() > session.expiresAt;
    const finalStatus = isExpired && session.status === "PENDING" ? "EXPIRED" : session.status;

    return NextResponse.json({
      success: true,
      data: {
        code: session.code,
        status: finalStatus,
        expiresAt: session.expiresAt.toISOString(),
        systemProfileId: session.systemProfileId,
        preview: session.systemProfile,
      },
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra mã liên kết:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tra cứu mã" },
      { status: 500 }
    );
  }
}
