import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      scope: 'openid profile email',
    },
  }),

  callback: handleCallback({
    async afterCallback(req: NextRequest, session: any) {
      // Auto-create business for new users
      const existing = await prisma.business.findUnique({
        where: { ownerId: session.user.sub },
      })

      if (!existing) {
        await prisma.business.create({
          data: {
            ownerId: session.user.sub,
            ownerEmail: session.user.email,
            name: `${session.user.name || session.user.email}'s Business`,
            policies: {
              create: [
                {
                  name: 'Default Daily Spending Limit',
                  type: 'spending_limit',
                  value: JSON.stringify({ daily: 100000, perTransaction: 50000 }),
                },
                {
                  name: 'Business Hours Only',
                  type: 'time_restriction',
                  value: JSON.stringify({ startHour: 7, endHour: 20 }),
                },
              ],
            },
          },
        })
      }

      return session
    },
  }),

  logout: handleLogout({ returnTo: '/' }),
})
