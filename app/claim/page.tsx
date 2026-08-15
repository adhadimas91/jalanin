import { prisma } from "@/lib/prisma";
import { ClaimAccountForm } from "@/components/claim-account-form";

export const dynamic = "force-dynamic";

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
  const { username } = await searchParams;

  let targetUser = null;
  if (username) {
    targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { id: username }],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        city: true,
        bio: true,
        isClaimed: true,
      },
    });
  }

  return (
    <main className="page-center">
      <ClaimAccountForm targetUser={targetUser} initialUsername={username || ""} />
    </main>
  );
}
