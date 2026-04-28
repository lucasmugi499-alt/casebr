"use client";

import AuthGuard from "@/components/AuthGuard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getDemoGeneratedDocumentsForClient } from "@/lib/demo/demoServices";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function HousingPlanReviewPage() {
  const { id, planId } = useParams<{ id: string; planId: string }>();
  const document = getDemoGeneratedDocumentsForClient(id).find((entry) => entry.id === planId);

  return (
    <AuthGuard allowedRoles={["caseworker"]}>
      <Card>
        <CardHeader><CardTitle>Housing Plan Review</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!document ? <p className="text-sm text-muted-foreground">Housing plan not found.</p> : (
            <>
              <p className="text-sm">Status: {document.status}</p>
              <Textarea value={document.generatedText} readOnly className="min-h-96" />
              <div className="flex gap-2">
                <Button onClick={() => navigator.clipboard.writeText(document.generatedText)}>Copy for SMIS</Button>
                <Link href={`/clients/${id}`} className={buttonVariants({ variant: "outline" })}>Return to Client Work File</Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AuthGuard>
  );
}
