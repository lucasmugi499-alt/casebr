import { setupStatus } from "@/app/actions/setup";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const { setupComplete } = await setupStatus();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <ShieldAlert className="h-6 w-6 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">CaseBridge Setup</CardTitle>
          <CardDescription>
            {setupComplete
              ? "Setup is already complete. Please log in."
              : "Create the first administrator and initialize your organization."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {setupComplete ? (
            <p className="rounded-md border bg-slate-100 px-4 py-3 text-sm text-slate-700">
              Setup is already complete. Please log in.
            </p>
          ) : (
            <SetupForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
