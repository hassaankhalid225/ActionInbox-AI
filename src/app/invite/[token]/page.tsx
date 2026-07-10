import { db } from "@/lib/db";
import { InviteAccept } from "@/components/auth/invite-accept";
import { Logo } from "@/components/shared/logo";
import { CircleX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type Role } from "@/lib/constants/enums";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invite = await db.invitation.findUnique({ where: { token: params.token }, include: { org: true } });
  const valid = invite && invite.status === "pending" && invite.expiresAt > new Date();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-muted/30 px-6">
      <Logo href="/" />
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        {valid ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Join {invite.org.name}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              You&apos;ve been invited to join as <span className="font-medium text-foreground">{ROLE_LABELS[invite.role as Role]}</span>. Set up your account to continue.
            </p>
            <div className="mt-5">
              <InviteAccept token={params.token} email={invite.email} />
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-muted text-danger"><CircleX className="size-6" /></div>
            <h1 className="mt-4 text-lg font-semibold">Invitation not valid</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">This invitation has expired or has already been used.</p>
            <Button asChild variant="outline" className="mt-5 w-full"><Link href="/login">Go to sign in</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
