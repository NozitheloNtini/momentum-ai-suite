import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GuestSaveDialog } from "@/components/guest-save-dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

type Kind = "meeting_note" | "task_plan" | "chat";

export function SaveButton({
  kind,
  title,
  data,
  disabled,
  label = "Save",
  featureLabel,
  size = "sm",
  variant = "outline",
}: {
  kind: Kind;
  title: string;
  data: unknown;
  disabled?: boolean;
  label?: string;
  featureLabel?: string;
  size?: "sm" | "default";
  variant?: "outline" | "default" | "ghost" | "secondary";
}) {
  const { isAuthenticated, user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (!isAuthenticated || !user) {
      setShowDialog(true);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("saved_items").insert({
      user_id: user.id,
      kind,
      title: title.slice(0, 200) || "Untitled",
      data: data as never,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved to your library");
  };

  return (
    <>
      <Button size={size} variant={variant} onClick={onClick} disabled={disabled || loading}>
        {loading ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-1.5 h-4 w-4" />
        )}
        {label}
      </Button>
      <GuestSaveDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        feature={featureLabel ?? "your work"}
      />
    </>
  );
}
