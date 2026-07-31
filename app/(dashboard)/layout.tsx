import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SapphireShell } from "@/components/layout/SapphireShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <SapphireShell>{children}</SapphireShell>;
}
