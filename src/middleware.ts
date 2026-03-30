import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

export default withMiddlewareAuthRequired()

export const config = {
  matcher: ['/dashboard/:path*', '/payments/:path*', '/links/:path*', '/staff/:path*', '/vault/:path*', '/audit/:path*', '/onboarding/:path*'],
}
