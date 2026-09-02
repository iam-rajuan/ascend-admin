"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/staff-api";
import {
  getLeadershipAggregate,
  getLeadershipBriefings,
  getLeadershipBriefingTemplates,
  getLeadershipDashboard,
  getLeadershipReports,
  getLeadershipReportTemplates,
  getLeadershipTrends,
  type LeadershipAggregate,
  type LeadershipBriefingSummary,
  type LeadershipBriefingTemplate,
  type LeadershipDashboardSummary,
  type LeadershipPeriod,
  type LeadershipReportsLibrary,
  type LeadershipReportTemplate,
  type LeadershipTrends,
} from "@/lib/role-dashboards-api";

type LeadershipContextType = {
  loading: boolean;
  error: string | null;
  period: LeadershipPeriod;
  setPeriod: (period: LeadershipPeriod) => void;
  dashboard: LeadershipDashboardSummary | null;
  aggregate: LeadershipAggregate | null;
  trends: LeadershipTrends | null;
  reports: LeadershipReportsLibrary | null;
  briefings: LeadershipBriefingSummary[];
  reportTemplates: LeadershipReportTemplate[];
  briefingTemplates: LeadershipBriefingTemplate[];
  refreshData: (toastMsg?: string) => Promise<void>;
  isMutating: boolean;
  setIsMutating: (val: boolean) => void;
};

const LeadershipContext = createContext<LeadershipContextType | undefined>(undefined);

export function LeadershipProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const { triggerToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<LeadershipPeriod>("12mo");
  const [isMutating, setIsMutating] = useState(false);

  const [dashboard, setDashboard] = useState<LeadershipDashboardSummary | null>(null);
  const [aggregate, setAggregate] = useState<LeadershipAggregate | null>(null);
  const [trends, setTrends] = useState<LeadershipTrends | null>(null);
  const [reports, setReports] = useState<LeadershipReportsLibrary | null>(null);
  const [briefings, setBriefings] = useState<LeadershipBriefingSummary[]>([]);
  const [reportTemplates, setReportTemplates] = useState<LeadershipReportTemplate[]>([]);
  const [briefingTemplates, setBriefingTemplates] = useState<LeadershipBriefingTemplate[]>([]);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [
        dashRes,
        aggRes,
        trendRes,
        repRes,
        brieRes,
        repTplRes,
        brieTplRes,
      ] = await Promise.all([
        getLeadershipDashboard(accessToken),
        getLeadershipAggregate(accessToken),
        getLeadershipTrends(accessToken, period),
        getLeadershipReports(accessToken),
        getLeadershipBriefings(accessToken),
        getLeadershipReportTemplates(accessToken),
        getLeadershipBriefingTemplates(accessToken),
      ]);

      setDashboard(dashRes);
      setAggregate(aggRes);
      setTrends(trendRes);
      setReports(repRes);
      setBriefings(brieRes.briefings ?? []);
      setReportTemplates(repTplRes.templates ?? []);
      setBriefingTemplates(brieTplRes.templates ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken, period]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && accessToken) {
      void loadData();
    }
  }, [accessToken, isAuthenticated, isHydrated, loadData]);

  const refreshData = async (toastMsg?: string) => {
    await loadData();
    if (toastMsg) {
      triggerToast(toastMsg);
    }
  };

  return (
    <LeadershipContext.Provider
      value={{
        loading,
        error,
        period,
        setPeriod,
        dashboard,
        aggregate,
        trends,
        reports,
        briefings,
        reportTemplates,
        briefingTemplates,
        refreshData,
        isMutating,
        setIsMutating,
      }}
    >
      {children}
    </LeadershipContext.Provider>
  );
}

export function useLeadership() {
  const context = useContext(LeadershipContext);
  if (!context) {
    throw new Error("useLeadership must be used within a LeadershipProvider");
  }
  return context;
}
