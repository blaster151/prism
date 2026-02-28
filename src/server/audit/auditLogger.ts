import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/server/db/prisma";

import type { AuditEventType } from "./eventTypes";

type JsonSafe =
  | string
  | number
  | boolean
  | null
  | JsonSafe[]
  | { [k: string]: JsonSafe };

export type AuditLogInput = {
  actorUserId?: string;
  eventType: AuditEventType | string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, JsonSafe>;
};

export async function auditLog(
  input: AuditLogInput,
  opts?: { tx?: Prisma.TransactionClient | PrismaClient },
) {
  const client = opts?.tx ?? prisma;
  const metadata = input.metadata ?? {};

  return await client.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata,
    },
    select: { id: true },
  });
}

