import { Loader2 } from "lucide-react";
import Image from "next/image";

export const Icons = {
    spinner: Loader2,
};

export function CloudNestLogo({ className, size = 24 }: { className?: string; size?: number }) {
    return (
        <Image 
            src="/favicon.ico" 
            alt="CloudNest" 
            width={size} 
            height={size} 
            className={`object-contain ${className}`}
        />
    );
} 