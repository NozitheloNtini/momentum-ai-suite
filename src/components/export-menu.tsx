import { Download, Copy, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { copyText, downloadText, safeFilename } from "@/lib/exports";

export function ExportMenu({
  markdown,
  filenameBase,
  label = "Export",
}: {
  markdown: string;
  filenameBase: string;
  label?: string;
}) {
  const base = safeFilename(filenameBase);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <Share2 className="mr-1.5 h-4 w-4" /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => copyText(markdown, "Copied as Markdown")}>
          <Copy className="mr-2 h-4 w-4" /> Copy as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadText(`${base}.md`, markdown, "text/markdown;charset=utf-8")}
        >
          <Download className="mr-2 h-4 w-4" /> Download .md
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadText(`${base}.txt`, markdown.replace(/[*_`#>|-]/g, ""))}
        >
          <Download className="mr-2 h-4 w-4" /> Download .txt
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
