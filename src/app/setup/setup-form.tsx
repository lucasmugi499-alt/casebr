"use client";

import { completeInitialSetup, type SetupInput } from "@/app/actions/setup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const setupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().trim().min(2, "Organization name is required"),
  primarySiteName: z.string().trim().min(2, "Primary site name is required"),
});

export function SetupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SetupInput>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      organizationName: "",
      primarySiteName: "",
    },
  });

  const onSubmit = async (values: SetupInput) => {
    setServerError(null);
    const result = await completeInitialSetup(values);

    if (!result.success) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Setup complete. You can now log in.");
    router.push("/login");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" {...form.register("firstName")} disabled={form.formState.isSubmitting} />
          {form.formState.errors.firstName && <p className="text-xs text-red-600">{form.formState.errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" {...form.register("lastName")} disabled={form.formState.isSubmitting} />
          {form.formState.errors.lastName && <p className="text-xs text-red-600">{form.formState.errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} disabled={form.formState.isSubmitting} />
        {form.formState.errors.email && <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...form.register("password")} disabled={form.formState.isSubmitting} />
        {form.formState.errors.password && <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizationName">Organization name</Label>
        <Input id="organizationName" {...form.register("organizationName")} disabled={form.formState.isSubmitting} />
        {form.formState.errors.organizationName && <p className="text-xs text-red-600">{form.formState.errors.organizationName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="primarySiteName">Primary site name</Label>
        <Input id="primarySiteName" {...form.register("primarySiteName")} disabled={form.formState.isSubmitting} />
        {form.formState.errors.primarySiteName && <p className="text-xs text-red-600">{form.formState.errors.primarySiteName.message}</p>}
      </div>

      {serverError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>}

      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creating administrator..." : "Complete setup"}
      </Button>
    </form>
  );
}
