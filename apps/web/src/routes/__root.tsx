import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { title } from "@/lib/meta";
import { getThemeServerFn } from "@/lib/theme";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  beforeLoad: async () => {
    const theme = await getThemeServerFn();

    return { theme };
  },
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, minimum-scale=1",
      },
      { title: title() },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>
          <Outlet />
          <Toaster richColors />
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  );
}
