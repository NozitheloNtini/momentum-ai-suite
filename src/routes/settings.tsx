import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { TopBar } from "@/components/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Momentum AI" },
      { name: "description", content: "Manage your Momentum AI profile, preferences, and API keys." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <>
      <TopBar title="Settings" subtitle="Profile, preferences, and integrations" />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 md:p-8">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>How you appear across Momentum.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input defaultValue="Alex Lee" />
            </div>
            <div className="space-y-1.5">
              <Label>Work email</Label>
              <Input defaultValue="alex@momentum.ai" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input defaultValue="Product Manager" />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input defaultValue="Europe/London" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
            <CardDescription>Tune how the assistant behaves.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle label="Concise summaries" description="Prefer shorter recaps by default." defaultChecked />
            <Separator />
            <Toggle label="Include risks in every summary" description="Always surface follow-ups and blockers." defaultChecked />
            <Separator />
            <Toggle label="Daily plan email" description="Send today's schedule at 8:30 AM." />
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">AI provider</CardTitle>
            <CardDescription>
              Prototype uses mock responses. Add an API key to connect a real model.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>API key</Label>
              <Input type="password" placeholder="sk-…" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button onClick={() => toast.success("Settings saved")}>Save changes</Button>
            </div>
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
