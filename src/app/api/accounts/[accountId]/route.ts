import { NextResponse } from "next/server";
import { getAccountById } from "@/src/db/accounts";

export async function GET(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  try {
    const account = await getAccountById(params.accountId);

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 