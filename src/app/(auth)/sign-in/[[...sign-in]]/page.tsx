import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In - CloudNest",
    description: "Sign in to your CloudNest account to access your secure cloud storage and manage your files.",
};

export default function Page() {
    return <SignIn />;
}
