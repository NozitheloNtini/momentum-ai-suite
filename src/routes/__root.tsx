import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Sparkles, Loader2 } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error; reset: () => void }) {
  console.error(error);
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              // Full reload re-runs app initialization (session restore, providers)
              // and returns the user to the URL they were viewing.
              try {
                const url = new URL(window.location.href);
                url.searchParams.set("_retry", String(Date.now()));
                window.location.assign(url.toString());
              } catch {
                window.location.reload();
              }
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Momentum AI — Workplace productivity assistant" },
      {
        name: "description",
        content:
          "Momentum AI automates meeting summaries, task planning, and workplace writing so professionals get hours back each week.",
      },
      { property: "og:title", content: "Momentum AI — Workplace productivity assistant" },
      {
        property: "og:description",
        content:
          "Momentum AI automates meeting summaries, task planning, and workplace writing so professionals get hours back each week.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Momentum AI — Workplace productivity assistant" },
      { name: "twitter:description", content: "Momentum AI automates meeting summaries, task planning, and workplace writing so professionals get hours back each week." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/92086827-7f1a-4efb-83af-4123d4b2fb12/id-preview-ef3cb619--90b303e6-36dd-4009-adb1-241e5b58ec5b.lovable.app-1783599623176.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/92086827-7f1a-4efb-83af-4123d4b2fb12/id-preview-ef3cb619--90b303e6-36dd-4009-adb1-241e5b58ec5b.lovable.app-1783599623176.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppFrame />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const BARE_PATHS = new Set(["/landing", "/auth", "/auth/callback", "/reset-password", "/"]);

function StartupLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-glow">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

function AppFrame() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { mode } = useAuth();

  // During initialization (session restore) show a splash instead of the
  // page shell, so sidebar-consuming pages never render without
  // SidebarProvider — including the server render on a browser refresh.
  if (mode === "loading") {
    return <StartupLoader />;
  }

  const bare = BARE_PATHS.has(pathname);

  if (bare) {
    return <Outlet />;
  }

  // Always mount SidebarProvider for any non-bare route so pages that call
  // useSidebar never crash — including signed-out states on protected URLs.
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-screen flex-col bg-background">
        <Outlet />
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
