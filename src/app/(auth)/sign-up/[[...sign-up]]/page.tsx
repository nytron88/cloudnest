import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up - CloudNest",
    description: "Create your CloudNest account and start storing your files securely in the cloud. Get 1GB of free storage to begin.",
};

export default function Page() {
    return <SignUp />;
}
