import { ScsLayout } from "@/features/scs/components/scs-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ScsLayout>{children}</ScsLayout>;
}
