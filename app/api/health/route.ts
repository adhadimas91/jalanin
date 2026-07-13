import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBlobStorageStatus } from "@/lib/blob-storage";

function envStatus() {
  return {
    databaseUrl: Boolean(process.env.DATABASE_URL),
    vercelBlob: getBlobStorageStatus(),
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
