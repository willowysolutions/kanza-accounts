export const dynamic = "force-dynamic";
import { UserForm } from "@/components/users/branch-manager/user-form";

export default async function SignUp() {
    const res = await fetch("/api/users", { cache: "no-store" });
    const { roles, branch } = await res.json();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <UserForm roles={roles} branches={branch}/>
          </div>
        </div>
  )
}
