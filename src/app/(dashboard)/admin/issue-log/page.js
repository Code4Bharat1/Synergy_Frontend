"use client";
import React from "react";
import IssueLogList from "@/components/common/IssueLogList";

export default function AdminIssueLogPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <IssueLogList title="Admin - Global Issue Log" />
    </div>
  );
}
