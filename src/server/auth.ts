import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/server/db/prisma";

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

          return {
            id: created.id,
            email: created.email,
            role: created.role,
          } as any;
        }

        if (!user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id ?? token.sub;
        (token as any).role = (user as any).role;
      }
      if (token.sub && !(token as any).role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        if (dbUser) (token as any).role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      try {
        const actorUserId = (message.user as any)?.id as string | undefined;
        if (!actorUserId) return;
        await prisma.auditEvent.create({
          data: {
            actorUserId,
            eventType: "auth.sign_in",
            metadata: { provider: message.account?.provider },
          },
        });
      } catch {
        // Do not block auth on audit failure.
      }
    },
    async signOut(message) {
      try {
        const actorUserId = (message.token?.sub as string | undefined) ?? undefined;
        if (!actorUserId) return;
        await prisma.auditEvent.create({
          data: {
            actorUserId,
            eventType: "auth.sign_out",
            metadata: {},
          },
        });
      } catch {
        // Do not block auth on audit failure.
      }
    },
  },
};

