import type { Metadata } from "next";
import { Workflow, FileText } from "lucide-react";
import Link from "next/link";
import { requireAuth, can } from "@/lib/auth/context";
import { getWorkflowRules, getTemplates } from "@/lib/services/workflows";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkflowDialog } from "@/components/workflows/workflow-dialog";
import { RuleCard } from "@/components/workflows/rule-card";
import { titleCase, truncate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Workflows" };
export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const ctx = await requireAuth();
  const [rules, templates] = await Promise.all([getWorkflowRules(ctx.org.id), getTemplates(ctx.org.id)]);
  const canManage = can(ctx.role, "workflow.manage");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Workflows"
        description="Automate routing, labeling, and escalation — and manage reusable message templates."
        actions={canManage ? <WorkflowDialog /> : undefined}
      />

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules"><Workflow className="size-4" /> Rules</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="size-4" /> Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {rules.length === 0 ? (
            <EmptyState icon={<Workflow />} title="No workflow rules yet" description="Create rules to auto-assign, tag, escalate, and notify — no code required." action={canManage ? <WorkflowDialog /> : undefined} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {rules.map((r) => <RuleCard key={r.id} rule={r} canManage={canManage} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <EmptyState icon={<FileText />} title="No templates yet" description="Templates power quotes, invoices, follow-ups, and reminders in your customers' language." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{t.name}</p>
                      {t.isDefault && <Badge variant="success" size="sm">Default</Badge>}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge variant="outline" size="sm">{titleCase(t.type)}</Badge>
                      <Badge variant="neutral" size="sm">{titleCase(t.tone)}</Badge>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">{truncate(t.body, 140)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
