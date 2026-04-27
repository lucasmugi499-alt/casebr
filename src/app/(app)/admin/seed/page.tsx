import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SeedPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Demo Data Seeding</CardTitle>
            <CardDescription>
              Browser-side seeding is disabled for security. Use the server-side script with Firebase Admin SDK.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="rounded-md border bg-slate-950 p-4 text-sm text-slate-100">npm run seed</pre>
            <p className="mt-3 text-sm text-slate-600">
              This script creates organization, sites, Firebase Auth users, matching Firestore user profiles,
              clients, notes, tasks, referrals, risk flags, safety plans, supervisor reviews, and audit logs.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
