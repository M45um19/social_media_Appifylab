import type { Metadata } from "next";
import FeedLayout from "@/features/feed/components/FeedLayout";

export const metadata: Metadata = {
  title: "Buddy Script - Feed",
  description: "Browse your feed on Buddy Script",
};

export default function FeedPage() {
  return <FeedLayout />;
}