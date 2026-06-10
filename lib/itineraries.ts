import { prisma } from "./prisma";

export async function getPublishedItineraries(userId?: string) {
  return prisma.itinerary.findMany({
    where: {
      OR: [
        { isPublished: true },
        ...(userId ? [{ authorId: userId }] : []),
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: true,
      days: {
        orderBy: {
          dayNumber: "asc",
        },
        include: {
          activities: {
            orderBy: {
              orderIndex: "asc",
            },
            include: {
              affiliateLink: true,
            },
          },
        },
      },
      saves: true,
      likes: true,
      copies: {
        select: {
          id: true,
        },
      },
      originalItinerary: {
        include: {
          author: true,
        },
      },
    },
  });
}

export async function getItineraryById(id: string) {
  return prisma.itinerary.findUnique({
    where: {
      id,
    },
    include: {
      author: true,
      days: {
        orderBy: {
          dayNumber: "asc",
        },
        include: {
          activities: {
            orderBy: {
              orderIndex: "asc",
            },
            include: {
              affiliateLink: true,
            },
          },
        },
      },
      saves: true,
      likes: true,
      copies: {
        select: {
          id: true,
        },
      },
      originalItinerary: {
        include: {
          author: true,
        },
      },
    },
  });
}

export async function getUserState(userId?: string) {
  if (!userId) {
    return {
      savedIds: [],
      likedIds: [],
    };
  }

  const [saves, likes] = await Promise.all([
    prisma.savedItinerary.findMany({
      where: {
        userId,
      },
      select: {
        itineraryId: true,
      },
    }),
    prisma.like.findMany({
      where: {
        userId,
      },
      select: {
        itineraryId: true,
      },
    }),
  ]);

  return {
    savedIds: saves.map((save) => save.itineraryId),
    likedIds: likes.map((like) => like.itineraryId),
  };
}
