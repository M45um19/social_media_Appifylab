import RegisterForm from "@/features/auth/components/RegisterForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buddy Script - Registration",
  description: "Join Buddy Script to connect with friends and share your life.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}