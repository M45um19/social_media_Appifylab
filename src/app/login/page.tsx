import LoginForm from "@/features/auth/components/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buddy Script - Login",
  description: "Log in to your account on Buddy Script",
};

export default function LoginPage() {
  return <LoginForm />;
}