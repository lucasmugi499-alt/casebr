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
  Target,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ServicePlanReviewPage() {
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
        <p className="text-muted-foreground">Service plan not found.</p>
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
                <Target className="h-5 w-5 text-primary" />
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-800">Service Plan Review Required</p>
              <p className="text-xs text-amber-700">This case plan is due for a scheduled review. Please meet with the client to track progress on action steps and update goals.</p>
              <Link href={`/clients/${id}/plans/service/new`} className="text-xs font-bold text-amber-800 underline hover:no-underline">
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
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  SMIS Case Planning Documentation
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleCopy}>
                    <ClipboardCopy className="h-3 w-3 mr-2" /> {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
                    <Printer className="h-3 w-3 mr-2" /> Print
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-8 bg-white dark:bg-slate-950 font-mono text-xs leading-relaxed whitespace-pre-wrap min-h-[600px] border-b">
                  {document.generatedText}
                </div>
              </CardContent>
              <CardHeader className="bg-muted/5">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-tight font-semibold">
                  <span>Document ID: {document.id}</span>
                  <span>Authored By: {document.createdById}</span>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* SIDEBAR / INFO */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Case Plan Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Status</p>
                  <Badge variant={document.status === "completed" ? "secondary" : "outline"} className="capitalize text-[10px]">
                    {document.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Last Updated</p>
                  <p className="font-medium text-xs">{new Date(document.updatedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Next Review Date</p>
                  <p className={cn("font-medium text-xs", isReviewDue ? "text-red-600 font-bold" : "")}>
                    {document.reviewDate ? new Date(document.reviewDate).toLocaleDateString() : "Not scheduled"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/clients/${id}/plans/service/new`} className={buttonVariants({ variant: "outline", className: "w-full justify-start h-9 text-[11px]" })}>
                  <Edit className="h-3.5 w-3.5 mr-2" /> Update Plan
                </Link>
                <Button variant="outline" className="w-full justify-start h-9 text-[11px]" disabled>
                  <History className="h-3.5 w-3.5 mr-2" /> Version History
                </Button>
                <Button variant="outline" className="w-full justify-start h-9 text-[11px] text-blue-600" onClick={handleCopy}>
                  <ExternalLink className="h-3.5 w-3.5 mr-2" /> Copied to SMIS
                </Button>
              </CardContent>
            </Card>

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg text-[11px] text-muted-foreground space-y-2">
              <p className="font-bold flex items-center gap-1 text-primary">
                <Target className="h-3 w-3" /> Shelter Standards Note
              </p>
              <p>Documentation aligns with Toronto Shelter Standards for case management and service planning. Review every 3 months or upon significant change.</p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
