import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function envStatus() {
  return {
    databaseUrl: Boolean(process.env.DATABASE_URL),
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabasePublishableKey: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}

export async function GET() {
  const env = envStatus();

  if (!env.databaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        env,
        database: "missing DATABASE_URL",
      },
      { status: 503 },
    );
  }

  try {
    await prisma.user.findFirst({
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      ok: true,
      env,
      database: "connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        env,
        database: "connection failed",
        error:
          error instanceof Error
            ? error.message.split("\n")[0]
            : "Unknown database error",
      },
      { status: 503 },
    );
  }
}
