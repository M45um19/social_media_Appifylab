import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL must be a valid URL"),
});

const envResult = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!envResult.success) {
  console.error(
    "Invalid environment variables configuration:\n",
    JSON.stringify(envResult.error.format(), null, 2)
  );
  throw new Error("Invalid environment variables config");
}

export const env = envResult.data;
