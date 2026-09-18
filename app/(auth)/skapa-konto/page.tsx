import { SignUpForm } from "../SignUpForm";
import { safeNextPath } from "@/lib/safeNextPath";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <SignUpForm next={safeNextPath(next)} />;
}
