"use client";

import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Tag, 
  MapPin, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowRight,
  ClipboardList,
  Target,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TemplatesPage() {
  const [noteCategories, setNoteCategories] = useState([
    "general check-in", "intake assessment", "housing", "income/benefits", 
    "identification/documents", "mental health", "substance use", "safety planning",
    "medical/health", "employment", "legal", "family/supports"
  ]);

  const [referralTypes, setReferralTypes] = useState([
    "housing", "income support", "ID replacement", "health/medical",
    "mental health", "substance use support", "employment", "legal",
    "food/clothing/basic needs", "community program"
  ]);

  const [checklistItems, setChecklistItems] = useState([
    { id: 1, label: "Intake completed", required: true },
    { id: 2, label: "Consent completed", required: true },
    { id: 3, label: "Service plan started", required: true },
    { id: 4, label: "Housing plan started", required: true },
    { id: 5, label: "ID status documented", required: false },
    { id: 6, label: "Income status documented", required: false },
    { id: 7, label: "Emergency contact documented", required: true },
  ]);

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates & Configuration</h1>
          <p className="text-muted-foreground">Standardize casework documentation and workflow steps.</p>
        </div>

        <Tabs defaultValue="notes" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="notes">Case Note Categories</TabsTrigger>
            <TabsTrigger value="referrals">Referral Types</TabsTrigger>
            <TabsTrigger value="checklist">Checklist Defaults</TabsTrigger>
            <TabsTrigger value="plans">Guided Plans</TabsTrigger>
          </TabsList>

          {/* NOTE CATEGORIES */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Case Note Categories</CardTitle>
                    <CardDescription>Define the available categories for daily documentation.</CardDescription>
                  </div>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {noteCategories.map((cat) => (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">{cat}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REFERRAL TYPES */}
          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Referral Types</CardTitle>
                    <CardDescription>Categories used to track external partner referrals.</CardDescription>
                  </div>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Type</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {referralTypes.map((type) => (
                    <div key={type} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">{type}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CHECKLIST DEFAULTS */}
          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Document Checklist Defaults</CardTitle>
                    <CardDescription>Required items for every new client file.</CardDescription>
                  </div>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y border-t">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          item.required ? "bg-primary" : "bg-muted-foreground/30"
                        )} />
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.required && <Badge variant="outline" className="text-[9px] h-4 uppercase font-bold py-0">Required</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-xs h-8">Edit</Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GUIDED PLANS */}
          <TabsContent value="plans" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PlanTemplateCard 
                title="Intake Assessment" 
                description="Comprehensive screening for new shelter admissions."
                steps={9}
                lastUpdated="2 days ago"
              />
              <PlanTemplateCard 
                title="Housing Plan" 
                description="Housing search, subsidy applications, and viewings."
                steps={9}
                lastUpdated="1 week ago"
              />
              <PlanTemplateCard 
                title="Safety Plan" 
                description="Risk reduction and emergency contact management."
                steps={9}
                lastUpdated="3 days ago"
              />
              <PlanTemplateCard 
                title="Service Plan" 
                description="Long-term goal setting and service coordination."
                steps={9}
                lastUpdated="Today"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

function PlanTemplateCard({ title, description, steps, lastUpdated }: { title: string, description: string, steps: number, lastUpdated: string }) {
  return (
    <Card className="group hover:shadow-md transition-all">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold">{steps} Steps</Badge>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Active Template</span>
        </div>
        <CardTitle className="mt-3 text-lg">{title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 flex items-center justify-between text-[11px] text-muted-foreground italic">
        <span>Updated {lastUpdated}</span>
        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-tight group-hover:text-primary transition-colors">
          View Questions <ArrowRight className="h-3 w-3 ml-1.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
