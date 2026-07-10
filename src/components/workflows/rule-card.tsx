"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Workflow, Trash2, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { parseJson } from "@/lib/utils/json";
import { titleCase } from "@/lib/utils/format";

type Rule = {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  isActive: boolean;
  runCount: number;
  conditionsJson: string;
  actionsJson: string;
};

const ACTION_LABELS: Record<string, string> = {
  assign_role: "Assign to role",
  add_label: "Add label",
  set_priority: "Set priority",
  notify_managers: "Notify managers",
};

export function RuleCard({ rule, canManage }: { rule: Rule; canManage: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(rule.isActive);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const conditions = parseJson<{ field: string; op: string; value: string }[]>(rule.conditionsJson, []);
  const actions = parseJson<{ type: string }[]>(rule.actionsJson, []);

  async function toggle(next: boolean) {
    setActive(next);
    try {
      await api.patch(`/api/workflows/${rule.id}`, { isActive: next });
      router.refresh();
    } catch {
      setActive(!next);
      toast.error("Could not update rule");
    }
  }

  async function remove() {
    setLoading(true);
    try {
      await api.del(`/api/workflows/${rule.id}`);
      toast.success("Rule deleted");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not delete rule");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-muted text-primary"><Workflow className="size-5" /></div>
            <div>
              <p className="font-medium">{rule.name}</p>
              {rule.description && <p className="mt-0.5 text-sm text-muted-foreground">{rule.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManage && <Switch checked={active} onCheckedChange={toggle} />}
            {canManage && (
              <Button variant="ghost" size="icon-sm" onClick={() => setConfirmOpen(true)} aria-label="Delete rule"><Trash2 className="size-4" /></Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
          <Badge variant="outline" size="sm">{titleCase(rule.trigger)}</Badge>
          {conditions.map((c, i) => <Badge key={i} variant="neutral" size="sm">{c.field} = {titleCase(c.value)}</Badge>)}
          <span className="text-muted-foreground">→</span>
          {actions.map((a, i) => <Badge key={i} variant="primary" size="sm"><Zap className="size-3" /> {ACTION_LABELS[a.type] ?? a.type}</Badge>)}
        </div>

        <p className="mt-3 text-2xs text-muted-foreground">Ran {rule.runCount} time{rule.runCount === 1 ? "" : "s"}</p>
      </CardContent>

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title={`Delete "${rule.name}"?`} description="This automation rule will stop running." confirmLabel="Delete" loading={loading} onConfirm={remove} />
    </Card>
  );
}
