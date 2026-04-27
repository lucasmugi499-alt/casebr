"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import AuthGuard from "@/components/AuthGuard";
import { generateCaseNote } from "@/app/actions/ai";
import { toast } from "sonner";
import { Sparkles, Save, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NewCaseNote() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [roughNotes, setRoughNotes] = useState("");
  const [generatedNote, setGeneratedNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);
  const [aiAssisted, setAiAssisted] = useState(false);

  const handleGenerate = async (type: string) => {
    if (!roughNotes.trim()) {
      toast.error("Please enter some rough notes first.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateCaseNote(roughNotes, type);
      if (response.success && response.data) {
        setGeneratedNote(response.data);
        setAiAssisted(true);
        setStep(2);
        toast.success("Note generated successfully");
        if (response.isMock) {
          toast.info("Using mock generator. Add GEMINI_API_KEY to use real AI.");
        }
      } else {
        toast.error(response.error || "Failed to generate note");
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    // In a real app, this would save to Firestore
    toast.success("Case note saved successfully!");
    router.push("/dashboard");
  };

  return (
    <AuthGuard allowedRoles={["caseworker", "ssa"]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Case Note</h2>
          <p className="text-muted-foreground">Document a client interaction.</p>
        </div>

        <div className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
          <span className={step >= 1 ? "font-bold text-indigo-600" : ""}>1. Input</span>
          <ArrowRight className="h-4 w-4" />
          <span className={step >= 2 ? "font-bold text-indigo-600" : ""}>2. Review & Save</span>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Interaction Details</CardTitle>
              <CardDescription>Enter the raw details of the interaction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="c1">Alex J.</SelectItem>
                      <SelectItem value="c2">Sarah T.</SelectItem>
                      <SelectItem value="c3">David M.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact Type</Label>
                  <Select defaultValue="in-person">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In-person</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="outreach">Outreach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Note Category</Label>
                <Select defaultValue="general">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General check-in</SelectItem>
                    <SelectItem value="housing">Housing</SelectItem>
                    <SelectItem value="mental-health">Mental health</SelectItem>
                    <SelectItem value="substance-use">Substance use</SelectItem>
                    <SelectItem value="system-nav">System navigation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <Label>Rough Summary & Actions</Label>
                </div>
                <Textarea 
                  placeholder="Type your rough notes here. Don't worry about formatting or sounding perfectly professional yet. Just get the facts down..."
                  className="min-h-[150px]"
                  value={roughNotes}
                  onChange={(e) => setRoughNotes(e.target.value)}
                />
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center text-indigo-900">
                  <Sparkles className="h-4 w-4 mr-2 text-indigo-600" />
                  AI Assistant
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-700"
                    onClick={() => handleGenerate("smis")}
                    disabled={isGenerating}
                  >
                    Generate Standard Note
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-700"
                    onClick={() => handleGenerate("professional")}
                    disabled={isGenerating}
                  >
                    Make More Professional
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-700"
                    onClick={() => handleGenerate("objective")}
                    disabled={isGenerating}
                  >
                    Make Objective
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button 
                onClick={() => {
                  setGeneratedNote(roughNotes);
                  setAiAssisted(false);
                  setStep(2);
                }}
                variant="secondary"
              >
                Skip AI & Review Manual Note
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Review & Finalize Note</span>
                {aiAssisted && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Assisted
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Review and edit the final note before saving to the client's file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea 
                  className="min-h-[300px] text-sm leading-relaxed"
                  value={generatedNote}
                  onChange={(e) => setGeneratedNote(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                <X className="mr-2 h-4 w-4" /> Back to Edit
              </Button>
              <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
                <Save className="mr-2 h-4 w-4" /> Save Final Note
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
}
