import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function GuestSaveDialog({
  open,
  onOpenChange,
  feature = "your work",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle>Create an account to save {feature}</DialogTitle>
          <DialogDescription>
            You're using Momentum AI as a guest — your data is temporary and will disappear when
            you sign out or close the tab. Sign up (free) to keep your history, sync across
            devices, and access your personal dashboard.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep browsing
          </Button>
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Create free account
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
