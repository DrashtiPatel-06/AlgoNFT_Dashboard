import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-4 border-gray-300 border-t-[#473957]",
        className
      )}
      style={{ width: "24px", height: "24px" }}
    />
  );
}
