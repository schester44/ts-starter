import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@__APP_NAME__/db";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const getInvitationDetails = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      invitationId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const invitation = await db.invitation.findFirst({
      where: {
        id: data.invitationId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        organization: true,
      },
    });

    return invitation;
  });

export const Route = createFileRoute("/accept-invitation/$id")({
  loader: async ({ params }) => {
    const invitation = await getInvitationDetails({
      data: {
        invitationId: params.id,
      },
    });

    return { invitation };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { invitation } = Route.useLoaderData();
  const { id: invitationId } = Route.useParams();
  const session = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session.data?.user) return;

    async function autoAccept() {
      try {
        const result = await authClient.organization.acceptInvitation({
          invitationId,
        });

        if (result.data) {
          navigate({ to: "/" });
        } else {
          if (result.error.code === "INVITATION_NOT_FOUND") {
            return navigate({ to: "/" });
          }

          toast.error(
            result.error?.message ||
              "Failed to accept invitation. Please try again.",
          );
        }
      } catch (error) {
        console.error("Error accepting invitation:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    }

    autoAccept();
  }, [session, invitationId, navigate]);

  if (session.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>This invitation is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.data?.user) return <Spinner className="size-6" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You have been invited to join{" "}
            <strong>{invitation.organization?.name}</strong>. To accept the
            invitation, please sign in.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={async () => {
              try {
                await authClient.signIn.social({
                  provider: "google",
                  callbackURL: "/accept-invitation/" + invitationId,
                });
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "An unexpected error occurred during Google sign-in.",
                );
              }
            }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
