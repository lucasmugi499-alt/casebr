"use client";

import { useState } from "react";
import { db } from "@/lib/firebase/client";
import { doc, setDoc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import AuthGuard from "@/components/AuthGuard";

export default function SeedPage() {
  const [loading, setLoading] = useState(false);

  const seedData = async () => {
    setLoading(true);
    try {
      // 1. Create Organization
      const orgId = "org-1";
      await setDoc(doc(db, "organizations", orgId), {
        id: orgId,
        name: "Heartland Shelter Services",
        createdAt: new Date().toISOString()
      });

      // 2. Create Sites
      const site1Id = "site-downtown";
      const site2Id = "site-uptown";
      await setDoc(doc(db, "sites", site1Id), {
        id: site1Id,
        organizationId: orgId,
        name: "Downtown Emergency Shelter",
        address: "123 Main St, Downtown",
        createdAt: new Date().toISOString()
      });
      await setDoc(doc(db, "sites", site2Id), {
        id: site2Id,
        organizationId: orgId,
        name: "Uptown Transitional Housing",
        address: "456 High St, Uptown",
        createdAt: new Date().toISOString()
      });

      // 3. Create Demo Clients
      const clients = [
        { id: "c1", name: "Alex Johnson", code: "AJ-450", priority: "high", status: "active", site: site1Id },
        { id: "c2", name: "Sarah Thompson", code: "ST-212", priority: "medium", status: "follow_up_needed", site: site1Id },
        { id: "c3", name: "Michael Reed", code: "MR-889", priority: "low", status: "active", site: site2Id },
        { id: "c4", name: "James Wilson", code: "JW-332", priority: "high", status: "intake", site: site1Id },
        { id: "c5", name: "Elena Martinez", code: "EM-105", priority: "medium", status: "housed", site: site2Id },
      ];

      for (const c of clients) {
        await setDoc(doc(db, "clients", c.id), {
          id: c.id,
          organizationId: orgId,
          siteId: c.site,
          displayName: c.name,
          clientCode: c.code,
          assignedWorkerIds: ["demo-worker-1"],
          status: c.status,
          priority: c.priority,
          currentGoal: "Secure permanent housing and stable income.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdById: "admin-1"
        });
      }

      // 4. Create some demo notes, tasks, etc.
      // (Simplified for MVP seeder)
      
      toast.success("Demo data seeded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to seed data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Seeder</CardTitle>
            <CardDescription>
              Populate your Firestore database with realistic demo data (Organizations, Sites, Clients).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
              <p className="text-sm text-amber-800 font-medium">Warning: This will overwrite existing data with IDs like 'org-1', 'site-downtown', etc.</p>
            </div>
            <Button 
              onClick={seedData} 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? "Seeding..." : "Seed Demo Data"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
