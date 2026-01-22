import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import '@/types/next-auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          })

          if (!user) return null
          if (!user.password) return null

          const passwordsMatch = await bcrypt.compare(password, user.password)

          if (passwordsMatch) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role?.name ?? null,
              permissions: user.role?.permissions.map((p) => p.name) ?? [],
            }
          }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign-in: transfer user data to token
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string | null }).role ?? null
        token.permissions = (user as { permissions?: string[] }).permissions ?? []
      }

      // Refresh role/permissions on session update or periodically
      if (trigger === 'update' || !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: (token.id as string) ?? token.sub },
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        })

        if (dbUser) {
          token.role = dbUser.role?.name ?? null
          token.permissions = dbUser.role?.permissions.map((p) => p.name) ?? []
        }
      }

      return token
    },
    async session({ token, session }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? ''
        session.user.role = token.role as string | null | undefined
        session.user.permissions = token.permissions as string[] | undefined
      }
      return session
    },
  },
})
