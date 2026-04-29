"use client";

import AuthGuard from "@/components/AuthGuard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getDemoActor } from "@/lib/demo/demoMode";
import { 
  completeDemoGeneratedDocumentWorkflow,
  copyDemoDocumentToSmis
} from "@/lib/demo/generatedDocumentWorkflow";
import { 
  updateDemoDocumentChecklist as updateStoreChecklist
} from "@/lib/demo/demoStore";
import { generateDocumentChecklistText } from "@/lib/casework/documentChecklistGenerator";
import { 
  getDemoDocumentChecklistForClient,
  getDemoClientById 
} from "@/lib/demo/demoServices";
import { Client, DocumentChecklist, DocumentChecklistStatus } from "@/types";
import { 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  LayoutDashboard,
  FileText,
  ClipboardCopy
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DOCUMENT_TYPES = [
  { id: "governmentId", label: "Government Photo ID", description: "Passport, Driver's License, or Provincial ID Card." },
  { id: "healthCard", label: "Health Card", description: "Valid Provincial Health Insurance Card." },
  { id: "sin", label: "SIN", description: "Social Insurance Number document or card." },
  { id: "proofOfIncome", label: "Proof of Income", description: "OW/ODSP statements, pay stubs, or pension letters." },
  { id: "noticeOfAssessment", label: "Notice of Assessment", description: "Most recent CRA Notice of Assessment (NOA)." },
  { id: "housingDocuments", label: "Housing Records", description: "Previous leases, eviction notices, or housing waitlist confirmations." },
  { id: "medicalDocuments", label: "Medical Documentation", description: "Disability support documents or medical clearance." },
  { id: "legalDocuments", label: "Legal / Immigration", description: "PR cards, work permits, or court orders." }
];

export default function DocumentChecklistPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [checklist, setChecklist] = useState<DocumentChecklist | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState("");

  useEffect(() => {
    if (!user || !id) return;
    const actor = {
      id: user.id,
      organizationId: user.organizationId,
      role: user.role,
      siteIds: user.siteIds,
    };

    const c = getDemoClientById(id, actor);
    setClient(c);
    if (c) {
      setChecklist(getDemoDocumentChecklistForClient(id));
    }
  }, [id, user]);

  const updateStatus = (field: keyof DocumentChecklist, status: DocumentChecklistStatus) => {
    if (!checklist) return;
    setChecklist({ ...checklist, [field]: status, updatedAt: new Date().toISOString() });
  };

  const handleSave = () => {
    const actor = getDemoActor();
    if (!checklist || !client || !actor) return;
    setSaving(true);
    try {
      // 1. Save the raw checklist data
      updateStoreChecklist(client.id, checklist);

      // 2. Generate the text for the GeneratedDocument
      const text = generateDocumentChecklistText(client, checklist);
      setGeneratedText(text);

      // 3. Use the standardized workflow helper
      const hasSomeId = checklist.governmentId === 'complete' || checklist.healthCard === 'complete' || checklist.sin === 'complete';
      const hasIncome = checklist.proofOfIncome === 'complete' || checklist.noticeOfAssessment === 'complete';

      const savedDoc = completeDemoGeneratedDocumentWorkflow({
        client,
        actor,
        documentType: "document_checklist",
        title: `Document Checklist - ${client.displayName}`,
        generatedText: text,
        sourceAnswers: checklist,
        relatedWorkstreamType: "other",
        checklistUpdates: {
          idStatusDocumented: hasSomeId,
          incomeStatusDocumented: hasIncome,
        }
      });

      setSavedDocId(savedDoc.id);

      toast.success("Document checklist saved.");
      // We don't redirect immediately to allow Copy for SMIS
    } catch (error) {
      console.error(error);
      toast.error("Failed to save checklist.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    toast.success("Copied to clipboard for SMIS");
    
    const actor = getDemoActor();
    if (actor && client && savedDocId) {
      copyDemoDocumentToSmis(client.id, savedDocId, actor);
    }
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (!client || !checklist) return <div className="p-8 text-center">Loading checklist...</div>;

  const getStatusBadge = (status: DocumentChecklistStatus) => {
    switch (status) {
      case 'complete': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Complete</Badge>;
      case 'missing': return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Missing</Badge>;
      case 'requested': return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200">Requested</Badge>;
      case 'not_applicable': return <Badge variant="secondary" className="opacity-50">N/A</Badge>;
      default: return null;
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/clients/${id}?tab=plans`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Document Checklist</h1>
              <p className="text-muted-foreground text-sm">Client: {client.displayName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {savedDocId && (
              <Button variant="outline" onClick={handleCopy}>
                <ClipboardCopy className="h-4 w-4 mr-2" /> {copied ? "Copied!" : "Copy for SMIS"}
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Mandatory Documents
              </CardTitle>
              <CardDescription>Update the status of required identification and income documents.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {DOCUMENT_TYPES.map((doc) => (
                  <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-bold">{doc.label}</Label>
                        {getStatusBadge((checklist as any)[doc.id])}
                      </div>
                      <p className="text-xs text-muted-foreground max-w-md">{doc.description}</p>
                    </div>
                    <Select 
                      value={(checklist as any)[doc.id]} 
                      onValueChange={(v: DocumentChecklistStatus) => updateStatus(doc.id as any, v)}
                    >
                      <SelectTrigger className="w-full sm:w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                        <SelectItem value="requested">Requested</SelectItem>
                        <SelectItem value="not_applicable">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Compliance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Total Documents</span>
                    <span>{DOCUMENT_TYPES.filter(d => (checklist as any)[d.id] === 'complete').length} / {DOCUMENT_TYPES.length}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500" 
                      style={{ width: `${(DOCUMENT_TYPES.filter(d => (checklist as any)[d.id] === 'complete').length / DOCUMENT_TYPES.length) * 100}%` }} 
                    />
                  </div>
                </div>
                
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30">
                    <span className="flex items-center gap-2">
                      {checklist.governmentId === 'complete' ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <AlertCircle className="h-3 w-3 text-amber-600" />}
                      Photo ID
                    </span>
                    <span className="font-bold uppercase text-[9px]">{checklist.governmentId}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30">
                    <span className="flex items-center gap-2">
                      {checklist.proofOfIncome === 'complete' ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Clock className="h-3 w-3 text-blue-600" />}
                      Proof of Income
                    </span>
                    <span className="font-bold uppercase text-[9px]">{checklist.proofOfIncome}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t pt-4">
                <p className="text-[10px] text-muted-foreground italic">Updating this checklist affects the "Plans & Checklists" card in the client file.</p>
              </CardFooter>
            </Card>

            <Link 
              href={`/clients/${client.id}`} 
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" /> Return to Client File
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
