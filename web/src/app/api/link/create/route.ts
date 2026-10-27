import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Ký tự dễ đọc, bỏ bớt 0, O, 1, I để tránh nhầm lẫn cho người dùng
const CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateCode(): string {
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export async function POST() {
  try {
    let code = generateCode();
    let isUnique = false;
    let attempts = 0;

    // Đảm bảo không trùng mã đang active
    while (!isUnique && attempts < 10) {
      const existing = await prisma.linkSession.findUnique({
        where: { code },
      });
      if (!existing) {
        isUnique = true;
      } else {
        code = generateCode();
        attempts++;
      }
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    const session = await prisma.linkSession.create({
      data: {
        code,
        status: "PENDING",
        expiresAt,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          code: session.code,
          expiresAt: session.expiresAt.toISOString(),
          expiresInSeconds: 900,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi khi tạo mã liên kết:", error);
    return NextResponse.json(
      { success: false, error: "Không thể tạo mã liên kết" },
      { status: 500 }
    );
  }
}
