import { NutritionistLayout } from "@/features/nutritionist/components/nutritionist-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <NutritionistLayout>{children}</NutritionistLayout>;
}
