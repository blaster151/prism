export const AuditEventTypes = {
  AuthSignIn: "auth.sign_in",
  AuthSignOut: "auth.sign_out",
  AdminAccess: "admin.access",
  AdminUserRoleChange: "admin.user.role_change",
  CandidateLifecycleChange: "candidate.lifecycle_change",
  DataRecordEdit: "data_record.edit",
  DropboxListFolder: "dropbox.list_folder",
} as const;

export type AuditEventType =
  (typeof AuditEventTypes)[keyof typeof AuditEventTypes];

