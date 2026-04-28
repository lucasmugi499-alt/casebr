"use client";

import { useParams } from "next/navigation";
import NewCaseNotePage from "../../../../notes/new/page";

export default function ClientSpecificNotePage() {
  const { id } = useParams<{ id: string }>();
  // This route is /clients/[id]/notes/new
  // The NewCaseNotePage component handles pre-selecting the client if id is available via searchParams or context
  // But wait, the NewCaseNotePage is a full page.
  // We can just render it here.
  return <NewCaseNotePage />;
}
