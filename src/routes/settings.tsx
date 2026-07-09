import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Momentum AI" },
      { name: "description", content: "Manage your Momentum AI profile and preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, isGuest, isAuthenticated, displayName } = useAuth();
  const [name, setName] = useState(isAuthenticated ? displayName : "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(isAuthenticated ? displayName : "");
    setEmail(user?.email ?? "");
  }, [displayName, user, isAuthenticated]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: name });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  return (
    <>
      <TopBar title="Settings" subtitle="Profile and preferences" />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-8">
        {isGuest ? (
          <Card className="border-primary/20 bg-primary/5 shadow-soft">
            <CardHeader>
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">You're a guest</CardTitle>
              <CardDescription>
                Create a free account to save your profile, sync preferences, and keep your work
                across devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create free account
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>How you appear across Momentum.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Display name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isGuest ? "Guest User" : "Your name"}
                disabled={!isAuthenticated}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} type="email" disabled placeholder="Not signed in" />
            </div>
          </CardContent>
          {isAuthenticated ? (
            <CardContent className="flex justify-end pt-0">
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </CardContent>
          ) : null}
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
            <CardDescription>Tune how the assistant behaves.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              label="Concise summaries"
              description="Prefer shorter recaps by default."
              defaultChecked
            />
            <Separator />
            <Toggle
              label="Include risks in every summary"
              description="Always surface follow-ups and blockers."
              defaultChecked
            />
            <Separator />
            <Toggle
              label="Daily plan email"
              description="Send today's schedule at 8:30 AM."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Toggle({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
