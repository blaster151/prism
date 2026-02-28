export const AuditEventTypes = {
  AuthSignIn: "auth.sign_in",
  AuthSignOut: "auth.sign_out",
  AdminAccess: "admin.access",
  AdminUserRoleChange: "admin.user.role_change",
} as const;

export type AuditEventType =
  (typeof AuditEventTypes)[keyof typeof AuditEventTypes];

