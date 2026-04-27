"use client";

import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function GeneralNoteEntryPage() {
  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "admin"]}>
      <Card>
        <CardHeader>
          <CardTitle>Select a client first</CardTitle>
          <CardDescription>
            Notes are now created from a client profile so they are attached directly to the correct timeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/clients" className={buttonVariants()}>Go to clients list</Link>
        </CardContent>
      </Card>
    </AuthGuard>
  );
}
