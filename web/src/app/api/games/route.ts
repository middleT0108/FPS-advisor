import { NextResponse } from "next/server";
import { getAllGameProfiles } from "@/lib/game-loader";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const games = getAllGameProfiles();
    return NextResponse.json({
      success: true,
      data: games,
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách game:", error);
    return NextResponse.json(
      { success: false, error: "Không thể nạp danh sách game" },
      { status: 500 }
    );
  }
}
