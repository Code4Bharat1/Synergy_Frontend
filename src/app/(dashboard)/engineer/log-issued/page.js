"use client";
import React from "react";
import IssueLogList from "@/components/common/IssueLogList";

export default function EngineerLogIssuedPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <IssueLogList title="My Logged Issues" />
    </div>
  );
}
