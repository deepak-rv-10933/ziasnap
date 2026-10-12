import { NextResponse } from "next/server";
import { MOCK_USER_ID, MOCK_USER_PROFILE } from "@/data/mock-user";

export async function GET() {
  return NextResponse.json({
    userId: MOCK_USER_ID,
    email: "arjun@example.com",
    firstName: MOCK_USER_PROFILE.personalDetails.name.split(" ")[0],
    lastName: MOCK_USER_PROFILE.personalDetails.name.split(" ").slice(1).join(" "),
  });
}
