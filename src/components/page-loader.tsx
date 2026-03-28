import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export function PageLoader({ text = "Loading...", className }: { text?: string, className?: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center w-full p-8 gap-3 min-h-[40vh]", className)}>
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        </div>
    )
}
