"use client";

import AppLayout from "@/components/AppLayout";
import LeadDashboard from "@/components/LeadDashboard";

export default function LeadsV2Page() {
  return (
    <AppLayout 
      title="Leads Dashboard" 
      subtitle="AI-Powered WhatsApp Intake"
    >
      <LeadDashboard />
    </AppLayout>
  );
}
