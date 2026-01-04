import { Outlet, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Navbar } from '@/components/navbar'
import { Toaster } from '@/components/ui/sonner'
import { SpeedProvider } from '@/lib/speed-context'
import { MatchProvider } from '@/lib/match-context'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Tierlist Voter',
      },
      {
        name: 'description',
        content: 'Vote on character matchups to generate a tier list.',
      },
      {
        name: 'keywords',
        content: 'tier list, voting, ranking',
      },
      {
        name: 'theme-color',
        content: '#ea7308',
      },
      {
        property: 'og:title',
        content: 'Tierlist Voter',
      },
      {
        property: 'og:description',
        content: 'Vote on character matchups to generate a tier list.',
      },
      {
        property: 'og:image',
        content: '/og-image.png',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Tierlist Voter',
      },
      {
        name: 'twitter:description',
        content: 'Vote on character matchups to generate a tier list.',
      },
      {
        name: 'twitter:image',
        content: '/og-image.png',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        href: '/logo192.png',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),
  // For TanStack Start, we wrap the entire document
  component: RootComponent,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center bg-gradient-to-b from-muted via-muted/20 to-black text-center px-4">
      <div className="max-w-md space-y-6">
        <h1 className="text-8xl font-serif font-black tracking-tighter text-primary drop-shadow-[0_0_20px_rgba(var(--primary),0.5)]">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold uppercase tracking-widest text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground text-lg">This page doesn't exist.</p>
        </div>
        <div className="pt-8">
          <a 
            href="/" 
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-bold text-primary-foreground shadow transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 uppercase tracking-widest"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <SpeedProvider>
          <MatchProvider>
            <div className="min-h-screen bg-background font-sans antialiased text-foreground flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Outlet />
              </main>
            </div>
          </MatchProvider>
          <TanStackRouterDevtools position="bottom-right" />
          <Toaster position="top-left" expand={false} />
        </SpeedProvider>
        <Scripts />
      </body>
    </html>
  )
}
