import type { Metadata } from "next";
import { Inbox, Zap, Sparkles, TriangleAlert, CircleDollarSign, Target, CircleCheckBig, Gauge } from "lucide-react";
import { requireAuth } from "@/lib/auth/context";
import { getAnalytics } from "@/lib/services/analytics";
import { PageHeader } from "@/components/shared/page-header";
import { StatTile } from "@/components/shared/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { TrendChart } from "@/components/charts/trend-chart";
import { HBarChart } from "@/components/charts/bar-chart";
import { formatMoney } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const ctx = await requireAuth();
  const { kpis, series, intentBars, actionBars } = await getAnalytics(ctx.org.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Operational performance — volume, automation, corrections, and cash." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Inbound processed" value={kpis.processed} hint={`of ${kpis.totalInbound} total`} icon={<Inbox />} tone="primary" />
        <StatTile label="Actions completed" value={kpis.executed} icon={<Zap />} tone="success" />
        <StatTile label="Automation rate" value={`${kpis.automationRate}%`} icon={<Target />} tone="accent" hint="Suggestions turned into actions" />
        <StatTile label="Correction rate" value={`${kpis.correctionRate}%`} icon={<Gauge />} tone={kpis.correctionRate > 20 ? "danger" : "info"} hint="Target ≤ 20%" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Avg. AI confidence" value={`${kpis.avgConfidence}%`} icon={<Sparkles />} tone="primary" />
        <StatTile label="Overdue invoices" value={kpis.overdueCount} icon={<TriangleAlert />} tone="danger" />
        <StatTile label="Outstanding" value={formatMoney(kpis.receivable, ctx.org.currency)} icon={<CircleDollarSign />} tone="warning" />
        <StatTile label="Tasks completed" value={kpis.completedTasks} icon={<CircleCheckBig />} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Volume trend</CardTitle>
            <p className="text-sm text-muted-foreground">Inbound items vs completed actions over the last 14 days.</p>
          </CardHeader>
          <CardContent>
            {series.length > 0 ? <TrendChart data={series} /> : <EmptyState compact title="No trend data yet" description="Process items to build analytics." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Automation health</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <Metric label="Automation rate" value={kpis.automationRate} target="Higher is better" tone="success" />
            <Metric label="Correction rate" value={kpis.correctionRate} target="Target ≤ 20%" tone={kpis.correctionRate > 20 ? "danger" : "primary"} />
            <Metric label="Avg. confidence" value={kpis.avgConfidence} target="Extraction quality" tone="accent" />
            <div className="rounded-lg border border-border bg-surface-muted/40 p-3 text-sm">
              <p className="text-muted-foreground">Estimated AI/OCR cost</p>
              <p className="tabnum mt-0.5 text-lg font-semibold">{formatMoney(kpis.aiCostCents, "USD")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Inbound by intent</CardTitle></CardHeader>
          <CardContent>
            {intentBars.length > 0 ? <HBarChart data={intentBars} /> : <EmptyState compact title="No data" description="Classify inbound items to see the breakdown." />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Actions by type</CardTitle></CardHeader>
          <CardContent>
            {actionBars.length > 0 ? <HBarChart data={actionBars} tone="accent" /> : <EmptyState compact title="No data" description="Generate action cards to see the breakdown." />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, target, tone }: { label: string; value: number; target: string; tone: "primary" | "success" | "danger" | "accent" }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabnum font-semibold">{value}%</span>
      </div>
      <Progress value={value} tone={tone} />
      <p className="mt-1 text-2xs text-muted-foreground">{target}</p>
    </div>
  );
}
