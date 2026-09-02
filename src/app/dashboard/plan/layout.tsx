import { PlanLayout } from "@/features/plan/components/plan-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PlanLayout>{children}</PlanLayout>;
}
