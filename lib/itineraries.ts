import { prisma } from "./prisma";
import { extractYouTubeVideoId } from "./youtube-ai";

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
              myLink: true,
              activityMyLinks: {
                include: {
                  myLink: true,
                },
                orderBy: {
                  orderIndex: "asc",
                },
              },
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
              myLink: true,
              activityMyLinks: {
                include: {
                  myLink: true,
                },
                orderBy: {
                  orderIndex: "asc",
                },
              },
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

export async function findItineraryByYouTubeUrl(
  inputUrl: string,
  excludeItineraryId?: string
) {
  const trimmed = inputUrl.trim();
  if (!trimmed) return null;

  const videoId = extractYouTubeVideoId(trimmed);
  const orConditions = videoId
    ? [
        { youtubeUrl: `https://www.youtube.com/watch?v=${videoId}` },
        { youtubeUrl: { contains: videoId } },
        { notes: { contains: `v=${videoId}` } },
        { notes: { contains: `youtu.be/${videoId}` } },
        { notes: { contains: `shorts/${videoId}` } },
      ]
    : [{ youtubeUrl: trimmed }];

  return prisma.itinerary.findFirst({
    where: {
      ...(excludeItineraryId ? { NOT: { id: excludeItineraryId } } : {}),
      OR: orConditions,
    },
    select: {
      id: true,
      title: true,
      youtubeUrl: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });
}
