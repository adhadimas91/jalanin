import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClaimAccountForm } from "@/components/claim-account-form";

export const dynamic = "force-dynamic";

export default async function ClaimUsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const targetUser = await prisma.user.findFirst({
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

  if (!targetUser) {
    notFound();
  }

  return (
    <main className="page-center">
      <ClaimAccountForm targetUser={targetUser} initialUsername={targetUser.username || targetUser.id} />
    </main>
  );
}
