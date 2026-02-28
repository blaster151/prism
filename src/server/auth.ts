import type { NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/server/db/prisma";
import { auditLog } from "@/server/audit/auditLogger";
import { AuditEventTypes } from "@/server/audit/eventTypes";

import { UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  providers: [
    CredentialsProvider({
      name: "Local",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          if (process.env.PRISM_ALLOW_USER_CREATE !== "true") return null;

          const passwordHash = await bcrypt.hash(password, 12);
          const created = await prisma.user.create({
            data: { email, passwordHash },
            select: { id: true, email: true, role: true },
          });

          const authUser: User = {
            id: created.id,
            email: created.email,
            role: created.role,
          };
          return authUser;
        }

        if (user.status !== UserStatus.ACTIVE) return null;
        if (!user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const authUser: User = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
        return authUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.role = user.role;
      }
      if (token.sub && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      try {
        const actorUserId = message.user?.id;
        if (!actorUserId) return;
        await auditLog({
          actorUserId,
          eventType: AuditEventTypes.AuthSignIn,
          metadata: { provider: message.account?.provider ?? null },
        });
      } catch {
        // Do not block auth on audit failure.
      }
    },
    async signOut(message) {
      try {
        const actorUserId = message.token?.sub;
        if (!actorUserId) return;
        await auditLog({
          actorUserId,
          eventType: AuditEventTypes.AuthSignOut,
          metadata: {},
        });
      } catch {
        // Do not block auth on audit failure.
      }
    },
  },
};

