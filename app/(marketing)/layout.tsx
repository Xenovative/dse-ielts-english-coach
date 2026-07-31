import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return <>{children}</>;
}
