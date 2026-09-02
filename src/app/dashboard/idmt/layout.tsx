import { IdmtLayout } from "@/features/idmt/components/idmt-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <IdmtLayout>{children}</IdmtLayout>;
}
