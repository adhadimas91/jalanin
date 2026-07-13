import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadImageToBlobStorage } from "@/lib/blob-storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return new NextResponse("File tidak ditemukan.", { status: 400 });
  }

  try {
    const url = await uploadImageToBlobStorage({
      file,
      userId: user.id,
    });

    return NextResponse.json({ url });
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : "Upload gagal.", {
      status: 400,
    });
  }
}
