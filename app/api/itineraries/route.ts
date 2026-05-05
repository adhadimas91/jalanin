import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getItineraryById } from "@/lib/itineraries";
import { prisma } from "@/lib/prisma";
import { serializeItinerary } from "@/lib/serialize";
import { uploadImageToSupabaseStorage } from "@/lib/supabase-storage";

function parseActivities(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [timePart, ...titleParts] = line.split("-");
      return {
        time: timePart?.trim() || `${9 + index}.00`,
        title: titleParts.join("-").trim() || line,
        locationName: "",
        estimatedCost: 0,
        category: index % 2 === 0 ? "City walk" : "Kuliner",
        orderIndex: index,
      };
    });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !destination || !description) {
    return new NextResponse("Judul, destinasi, dan deskripsi wajib diisi.", { status: 400 });
  }

  const activities = parseActivities(formData.get("activities"));

  let coverImageUrl = String(formData.get("coverImageUrl") ?? "/uploads/default-cover.svg");
  const imageFile = formData.get("imageFile");

  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      coverImageUrl = await uploadImageToSupabaseStorage({
        file: imageFile,
        userId: user.id,
      });
    } catch (error) {
      return new NextResponse(error instanceof Error ? error.message : "Upload gagal.", {
        status: 400,
      });
    }
  }

  const created = await prisma.itinerary.create({
    data: {
      title,
      destination,
      description,
      durationDays: Number(formData.get("durationDays") ?? 1),
      estimatedBudget: Number(formData.get("estimatedBudget") ?? 0),
      travelStyle: String(formData.get("travelStyle") ?? "Budget trip"),
      coverImageUrl,
      notes: String(formData.get("notes") ?? ""),
      authorId: user.id,
      days: {
        create: {
          dayNumber: 1,
          title: "Hari 1 - Rute Pertama",
          activities: {
            create: activities.length
              ? activities
              : [
                  {
                    time: "09.00",
                    title: "Tiba di destinasi",
                    locationName: "",
                    category: "Transport",
                    orderIndex: 0,
                  },
                ],
          },
        },
      },
    },
  });

  const itinerary = await getItineraryById(created.id);

  if (!itinerary) {
    return new NextResponse("Itinerary gagal dimuat.", { status: 500 });
  }

  if (request.headers.get("accept")?.includes("text/html")) {
    return NextResponse.redirect(new URL(`/itinerary/${created.id}`, request.url), { status: 303 });
  }

  return NextResponse.json(serializeItinerary(itinerary));
}
