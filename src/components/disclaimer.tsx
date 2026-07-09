import { Info } from "lucide-react";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      className={
        "flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground/90 " +
        className
      }
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning-foreground/80" />
      <p>
        <span className="font-medium">Disclaimer:</span> AI-generated content may require human
        review before being used for business decisions or official communication.
      </p>
    </div>
  );
}
