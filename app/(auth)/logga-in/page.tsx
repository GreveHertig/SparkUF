import { LogInForm } from "../LogInForm";
import { safeNextPath } from "@/lib/safeNextPath";

export default async function LogInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LogInForm next={safeNextPath(next)} />;
}
