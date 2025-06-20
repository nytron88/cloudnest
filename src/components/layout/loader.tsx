import { Icons } from "@/components/icons";

export default function Loader() {
    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative">
                <Icons.spinner className="h-12 w-12 animate-spin text-primary" />
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            </div>
            <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
    );
}