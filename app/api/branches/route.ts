import { NextRequest, NextResponse } from "next/server";
import {
  branches,
  getPublishedBranches,
  type Branch,
} from "../../../data/branches";

export const runtime = "nodejs";

/**
 * GET /api/branches
 *
 * Query:
 * - city?: string — lọc theo thành phố (vd: "Hồ Chí Minh")
 * - published?: "true" | "1" — chỉ trả chi nhánh đã tới ngày publishAt
 * - all?: "true" | "1" — trả toàn bộ kể cả chưa publish (mặc định)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city")?.trim();
    const publishedOnly =
      searchParams.get("published") === "true" ||
      searchParams.get("published") === "1";

    let result: Branch[] = publishedOnly
      ? getPublishedBranches()
      : [...branches];

    if (city && city !== "Tất cả") {
      result = result.filter(
        (branch) => branch.city.toLowerCase() === city.toLowerCase()
      );
    }

    return NextResponse.json(
      {
        success: true,
        count: result.length,
        data: result,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[api/branches] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Không thể lấy danh sách chi nhánh",
      },
      { status: 500 }
    );
  }
}
