"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/lib/api/admin";
import type { NotificationSettings } from "@/lib/types";
import { toast } from "@/lib/ui/toast";

const settingsSchema = z.object({
  newUserRegistrations: z.boolean(),
  loanApplications: z.boolean(),
  kycSubmissions: z.boolean(),
  systemAlerts: z.boolean(),
  browserNotifications: z.boolean(),
});
const defaults: NotificationSettings = {
  newUserRegistrations: false,
  loanApplications: false,
  kycSubmissions: false,
  systemAlerts: false,
  browserNotifications: false,
};
const preferences: {
  key: keyof NotificationSettings;
  title: string;
  description: string;
}[] = [
  {
    key: "newUserRegistrations",
    title: "New User Registrations",
    description: "Get notified when new users sign up",
  },
  {
    key: "loanApplications",
    title: "Loan Applications",
    description: "Get notified of new loan applications",
  },
  {
    key: "kycSubmissions",
    title: "KYC Submissions",
    description: "Get notified of pending KYC verifications",
  },
  {
    key: "systemAlerts",
    title: "System Alerts",
    description: "Get notified of system errors and warnings",
  },
];
function NotificationsContent() {
  const [values, setValues] = useState<NotificationSettings>(defaults);
  const [saved, setSaved] = useState<NotificationSettings>(defaults);
  const [supported, setSupported] = useState(false);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "settings", "notifications"],
    queryFn: getNotificationSettings,
  });
  useEffect(() => {
    setSupported(typeof window !== "undefined" && "Notification" in window);
  }, []);
  useEffect(() => {
    if (query.data) {
      setValues(query.data);
      setSaved(query.data);
    }
  }, [query.data]);
  const mutation = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      setSaved(values);
      toast.success("Notification preferences saved");
      void client.invalidateQueries({
        queryKey: ["admin", "settings", "notifications"],
      });
    },
    onError: () => toast.error("Failed to save preferences"),
  });
  const dirty = Object.keys(defaults).some(
    (key) =>
      values[key as keyof NotificationSettings] !==
      saved[key as keyof NotificationSettings],
  );
  const update = (key: keyof NotificationSettings, value: boolean) =>
    setValues((old) => ({ ...old, [key]: value }));
  const browserChange = async (enabled: boolean) => {
    if (!enabled) {
      update("browserNotifications", false);
      return;
    }
    if (!supported) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        update("browserNotifications", false);
        toast.error(
          "Your browser blocked notifications for this site. Allow them in the browser's site settings.",
        );
        return;
      }
      update("browserNotifications", true);
    } catch {
      update("browserNotifications", false);
      toast.error("Couldn't request browser notification permission");
    }
  };
  const save = () => {
    const parsed = settingsSchema.safeParse(values);
    if (!parsed.success) {
      toast.error("Check your notification preferences");
      return;
    }
    mutation.mutate(parsed.data);
  };
  const cancel = () => setValues(saved);
  const row = (
    key: keyof NotificationSettings,
    title: string,
    description: string,
    disabled = false,
    onChange?: (value: boolean) => void,
  ) => (
    <label
      key={key}
      className="flex cursor-pointer items-start justify-between gap-4 px-4 py-3.5 sm:items-center"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ui-ink">{title}</span>
        <span className="text-xs text-ui-muted">{description}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-label={title}
        aria-checked={values[key]}
        checked={values[key]}
        disabled={disabled}
        onChange={(event) =>
          onChange
            ? onChange(event.target.checked)
            : update(key, event.target.checked)
        }
        className="h-5 w-5 shrink-0 cursor-pointer rounded-sm border-ui-line accent-ui-accent disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
  return (
    <>
      <PageHeader
        title="Notification Preferences"
        icon={Bell}
        subtitle="Choose what you want to be notified about"
      />
      {query.isError && (
        <p className="ui-alert ui-alert-danger">
          Couldn't load notification preferences.{" "}
          <button
            type="button"
            className="ui-btn ui-btn-sm"
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
        </p>
      )}
      <div className="space-y-4">
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Email Notifications</h2>
          </div>
          <div className="ui-panel-body divide-y divide-ui-line">
            {preferences.map((item) =>
              row(item.key, item.title, item.description),
            )}
          </div>
        </section>
        <section className="ui-panel">
          <div className="ui-panel-head">
            <h2 className="ui-panel-title">Push Notifications</h2>
          </div>
          <div className="ui-panel-body">
            {row(
              "browserNotifications",
              "Browser Notifications",
              supported
                ? "Show browser push notifications"
                : "Not supported in this browser",
              !supported,
              (enabled) => void browserChange(enabled),
            )}
          </div>
        </section>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="ui-btn ui-btn-primary w-full sm:w-auto"
            disabled={!dirty || mutation.isPending || query.isPending}
            onClick={save}
          >
            {mutation.isPending ? "Saving…" : "Save Preferences"}
          </button>
          {dirty && (
            <button
              type="button"
              className="ui-btn w-full sm:w-auto"
              onClick={cancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </>
  );
}
export default function NotificationsPage() {
  return <NotificationsContent />;
}
