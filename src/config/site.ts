import { env } from "@/lib/env";

export const siteConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  description:
    "Ascend is a Dominion Performance preventive health and human performance platform.",
  url: env.NEXT_PUBLIC_APP_URL,
};
