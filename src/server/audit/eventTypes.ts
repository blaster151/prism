export const AuditEventTypes = {
  AuthSignIn: "auth.sign_in",
  AuthSignOut: "auth.sign_out",
  AdminAccess: "admin.access",
} as const;

export type AuditEventType =
  (typeof AuditEventTypes)[keyof typeof AuditEventTypes];

