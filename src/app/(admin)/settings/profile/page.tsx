"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { changePassword, getProfile, updateProfile } from "@/lib/api/admin";
import type { Profile } from "@/lib/types";
import { toast } from "@/lib/ui/toast";

const phone = /^((\+234|0)[789][01]\d{8})?$/;
const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Enter a valid email").max(254),
  phone: z.string().trim().regex(phone, "Enter a valid Nigerian phone number"),
});
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Use 8–128 characters")
      .max(128, "Use 8–128 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "New password must differ from the current one",
  })
  .refine((values) => values.confirmPassword === values.newPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;
function ProfileContent() {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "profile"],
    queryFn: getProfile,
  });
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "" },
  });
  const password = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  useEffect(() => {
    if (query.data)
      form.reset({
        firstName: query.data.firstName ?? "",
        lastName: query.data.lastName ?? "",
        email: query.data.email ?? "",
        phone: query.data.phone ?? "",
      });
  }, [query.data, form]);
  const save = useMutation({
    mutationFn: (values: ProfileValues) => updateProfile(values),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      form.reset(form.getValues());
      void client.invalidateQueries({ queryKey: ["admin", "profile"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });
  const change = useMutation({
    mutationFn: (values: PasswordValues) =>
      changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      toast.success("Password changed");
      password.reset();
      setPasswordOpen(false);
    },
    onError: (error: Error) =>
      password.setError("root", {
        message: error.message || "Couldn't change password. Please try again.",
      }),
  });
  const error = (name: keyof ProfileValues) =>
    form.formState.errors[name]?.message;
  const passwordError = (name: keyof PasswordValues) =>
    password.formState.errors[name]?.message;
  return (
    <>
      <PageHeader
        title="Profile Settings"
        icon={User}
        subtitle="Manage your account details and security"
      />
      {query.isError && (
        <p className="ui-alert ui-alert-danger">
          Couldn't load your profile.{" "}
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
            <h2 className="ui-panel-title">Profile Information</h2>
          </div>
          <form
            className="ui-panel-body space-y-4 p-4"
            noValidate
            onSubmit={form.handleSubmit((values) => save.mutate(values))}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(["firstName", "lastName", "email", "phone"] as const).map(
                (key) => (
                  <label key={key} className="ui-label">
                    {key === "firstName"
                      ? "First name"
                      : key === "lastName"
                        ? "Last name"
                        : key === "email"
                          ? "Email address"
                          : "Phone number"}
                    <input
                      className="ui-input mt-1"
                      type={
                        key === "email"
                          ? "email"
                          : key === "phone"
                            ? "tel"
                            : "text"
                      }
                      {...form.register(key)}
                      aria-describedby={
                        error(key) ? `profile-${key}-error` : undefined
                      }
                    />
                    {error(key) && (
                      <span
                        id={`profile-${key}-error`}
                        className="text-xs text-ui-danger"
                      >
                        {error(key)}
                      </span>
                    )}
                  </label>
                ),
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                className="ui-btn ui-btn-primary w-full sm:w-auto"
                disabled={
                  !form.formState.isDirty || save.isPending || query.isPending
                }
              >
                {save.isPending ? "Saving…" : "Save Changes"}
              </button>
              {form.formState.isDirty && (
                <button
                  type="button"
                  className="ui-btn w-full sm:w-auto"
                  onClick={() => form.reset(query.data as Profile)}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
        <section className="ui-panel">
          <div className="ui-panel-head">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} />
              <h2 className="ui-panel-title">Security & Authentication</h2>
            </div>
          </div>
          <div className="ui-panel-body divide-y divide-ui-line">
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-medium text-ui-ink">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-ui-muted">Required for all admins</p>
              </div>
              <span className="ui-badge ui-badge-success">On</span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ui-ink">
                    Change Password
                  </p>
                  <p className="text-xs text-ui-muted">
                    Update your sign-in password
                  </p>
                </div>
                <button
                  className="ui-btn"
                  type="button"
                  onClick={() => {
                    setPasswordOpen((value) => !value);
                    password.clearErrors();
                  }}
                >
                  {passwordOpen ? (
                    "Cancel"
                  ) : (
                    <>
                      <KeyRound size={15} />
                      Change Password
                    </>
                  )}
                </button>
              </div>
              {passwordOpen && (
                <form
                  className="mt-4 space-y-4 border-t border-ui-line pt-4"
                  noValidate
                  onSubmit={password.handleSubmit((values) =>
                    change.mutate(values),
                  )}
                >
                  <label className="ui-label">
                    Current password
                    <input
                      className="ui-input mt-1"
                      type="password"
                      autoComplete="current-password"
                      {...password.register("currentPassword")}
                      aria-describedby={
                        passwordError("currentPassword")
                          ? "current-password-error"
                          : undefined
                      }
                    />
                    {passwordError("currentPassword") && (
                      <span
                        id="current-password-error"
                        className="text-xs text-ui-danger"
                      >
                        {passwordError("currentPassword")}
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="ui-label">
                      New password
                      <input
                        className="ui-input mt-1"
                        type="password"
                        autoComplete="new-password"
                        {...password.register("newPassword")}
                        aria-describedby={
                          passwordError("newPassword")
                            ? "new-password-error"
                            : undefined
                        }
                      />
                      {passwordError("newPassword") && (
                        <span
                          id="new-password-error"
                          className="text-xs text-ui-danger"
                        >
                          {passwordError("newPassword")}
                        </span>
                      )}
                    </label>
                    <label className="ui-label">
                      Confirm new password
                      <input
                        className="ui-input mt-1"
                        type="password"
                        autoComplete="new-password"
                        {...password.register("confirmPassword")}
                        aria-describedby={
                          passwordError("confirmPassword")
                            ? "confirm-password-error"
                            : undefined
                        }
                      />
                      {passwordError("confirmPassword") && (
                        <span
                          id="confirm-password-error"
                          className="text-xs text-ui-danger"
                        >
                          {passwordError("confirmPassword")}
                        </span>
                      )}
                    </label>
                  </div>
                  {password.formState.errors.root?.message && (
                    <div className="ui-alert ui-alert-danger">
                      {password.formState.errors.root.message}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="ui-btn ui-btn-primary w-full sm:w-auto"
                    disabled={change.isPending}
                  >
                    {change.isPending ? "Changing…" : "Update password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
export default function ProfilePage() {
  return <ProfileContent />;
}
