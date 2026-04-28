"use client";

import AuthGuard from "@/components/AuthGuard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getDemoGeneratedDocumentsForClient } from "@/lib/demo/demoServices";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ClipboardCopy, 
  FileText, 
  History, 
  ExternalLink,
  Printer,
  Edit,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SafetyPlanReviewPage() {
  const { id, planId } = useParams<{ id: string; planId: string }>();
  const router = useRouter();
  const documents = getDemoGeneratedDocumentsForClient(id);
  const document = documents.find((entry) => entry.id === planId);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (document) {
      navigator.clipboard.writeText(document.generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    }
  };

  if (!document) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Safety plan not found.</p>
        <Link href={`/clients/${id}`} className={buttonVariants({ variant: "outline" })}>
          Return to Client File
        </Link>
      </div>
    );
  }

  const isReviewDue = document.status === "review_due" || (document.reviewDate && new Date(document.reviewDate) < new Date());

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa", "manager", "admin"]}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/clients/${id}?tab=plans`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">{document.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground">Generated on {new Date(document.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isReviewDue ? "destructive" : "default"} className="capitalize">
              {isReviewDue ? "Review Due" : document.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {isReviewDue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-800">Safety Plan Review Due</p>
              <p className="text-xs text-red-700">This safety plan is due for review or has passed its review date. Please schedule a review with the client and update the plan.</p>
              <Link href={`/clients/${id}/plans/safety/new`} className="text-xs font-bold text-red-800 underline hover:no-underline">
                Start Review / Update
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* MAIN CONTENT */}
          <div className="md:col-span-3 space-y-6">
            <Card className="shadow-lg border-primary/10">
              <CardHeader className="border-b bg-muted/30 py-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <FileText className="h-5 w-5 text-primary" />
                  SMIS Documentation Format
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <ClipboardCopy className="h-4 w-4 mr-2" /> {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Printer className="h-4 w-4 mr-2" /> Print
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-8 bg-white dark:bg-slate-950 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[600px] border-b">
                  {document.generatedText}
                </div>
              </CardContent>
              <CardHeader className="bg-muted/5">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-tight">
                  <span>Document ID: {document.id}</span>
                  <span>Staff: {document.createdById}</span>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* SIDEBAR / INFO */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Plan Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Status</p>
                  <Badge variant={document.status === "completed" ? "secondary" : "outline"} className="capitalize">
                    {document.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Last Updated</p>
                  <p className="font-medium">{new Date(document.updatedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Next Review Date</p>
                  <p className={cn("font-medium", isReviewDue ? "text-red-600 font-bold" : "")}>
                    {document.reviewDate ? new Date(document.reviewDate).toLocaleDateString() : "Not scheduled"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/clients/${id}/plans/safety/new`} className={buttonVariants({ variant: "outline", className: "w-full justify-start h-9 text-xs" })}>
                  <Edit className="h-3.5 w-3.5 mr-2" /> Update Plan
                </Link>
                <Button variant="outline" className="w-full justify-start h-9 text-xs" disabled>
                  <History className="h-3.5 w-3.5 mr-2" /> Version History
                </Button>
                <Button variant="outline" className="w-full justify-start h-9 text-xs text-blue-600" onClick={handleCopy}>
                  <ExternalLink className="h-3.5 w-3.5 mr-2" /> Copied to SMIS
                </Button>
              </CardContent>
            </Card>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg text-xs text-blue-800 dark:text-blue-400 space-y-2">
              <p className="font-bold flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> SMIS Note
              </p>
              <p>Professional documentation of safety planning for entry into SMIS 'Case Notes'. Avoid graphic details.</p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
