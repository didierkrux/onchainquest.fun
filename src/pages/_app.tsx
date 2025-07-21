import Web3ModalProvider from 'context'
import type { AppProps } from 'next/app'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import NextHead from 'next/head'
import { Global, css } from '@emotion/react'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLocalStorage } from 'usehooks-ts'

import Layout from 'components/Layout'
import MiniAppSDK from 'components/MiniAppSDK'
import FrameLoginProvider from 'components/FrameLoginProvider'
import theme from 'theme'
import 'utils/translation'
import NonSSRWrapper from 'components/NonSSRWrapper'
import { MENU, eventName, DOMAIN_URL, eventDescription, IS_PROD } from 'config/index'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const appIcon = `${process.env.NEXT_PUBLIC_APP_ICON || `${DOMAIN_URL}/app-icon.png`}?v=1`

export default function MyApp({ Component, pageProps }: AppProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [privyEnabled] = useLocalStorage<boolean>('privy-enabled', false)

  const menuIndex = router.pathname ? MENU.findIndex((item) => item.href === router.pathname) : 0
  const label = MENU[menuIndex]?.label || ''
  // i18next-parser: disable-next-line
  const title = label ? t(label) : ''
  const socialImage = `${process.env.NEXT_PUBLIC_SOCIAL_IMAGE || `${DOMAIN_URL}/social.jpg`}?v=1`
  const url = `${DOMAIN_URL}${router.pathname}`
  const pageTitle = title ? `${title} | ${eventName}` : eventName
  const description = eventDescription
  const canonical = url?.split('?')[0]

  // Mini App embed metadata
  const miniAppEmbed = {
    version: '1',
    imageUrl: socialImage,
    button: {
      title: 'Start Quest',
      action: {
        type: 'launch_frame',
        name: eventName,
        url: `${DOMAIN_URL}/?pwa=true`,
        splashImageUrl: appIcon,
        splashBackgroundColor: '#fbf5ee',
      },
    },
  }

  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <QueryClientProvider client={queryClient}>
      <Web3ModalProvider>
        <ChakraProvider theme={theme}>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <NextHead>
            <title>{pageTitle}</title>
            <meta name="description" content={description} />
            <meta charSet="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0, maximum-scale=1, viewport-fit=cover"
            />
            {IS_PROD && (
              <link rel="shortcut icon" sizes="512x512" type="image/png" href={appIcon} />
            )}
            <link rel="canonical" href={canonical} />
            <meta name="robots" content={IS_PROD ? 'all' : 'noindex'}></meta>

            {/* Farcaster Mini App Embed */}
            <meta name="fc:miniapp" content={JSON.stringify(miniAppEmbed)} />
            <meta name="fc:frame" content={JSON.stringify(miniAppEmbed)} />

            {/* Progressive Web App */}
            <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
            <link rel="apple-touch-icon" href={appIcon} />
            <meta name="apple-mobile-web-app-title" content={eventName} />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="application-name" content={eventName} />
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="theme-color" content="#fbf5ee" />
            <meta name="msapplication-navbutton-color" content="#fbf5ee" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            {/* Open Graph / Facebook (needs to be < 300kb to work on WhatsApp) */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={socialImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="675" />
            {/* Twitter */}
            <meta property="twitter:url" content={url} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={socialImage} />
          </NextHead>
          <NonSSRWrapper>
            <Global
              styles={css`
                html,
                body {
                  margin: 0;
                  padding: 0;
                  height: 100%;
                  /* overflow-x: hidden; */
                  padding-top: env(safe-area-inset-top);
                  padding-right: env(safe-area-inset-right);
                  padding-bottom: env(safe-area-inset-bottom);
                  padding-left: env(safe-area-inset-left);
                }
                #__next {
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                }
                main {
                  flex: 1;
                  overflow-y: auto;
                  -webkit-overflow-scrolling: touch;
                }
                @font-face {
                  font-family: 'NeueAugenblick';
                  src: url(/fonts/NeueAugenblick-ExtraBold.ttf);
                }
                @font-face {
                  font-family: 'Inter';
                  src: url(/fonts/Inter-Regular.ttf);
                }
                [class^='EmailInputForm'],
                [class*=' EmailInputForm'] {
                  ${privyEnabled ? '' : 'display: none !important;'}
                }
              `}
            />
            <FrameLoginProvider>
              <MiniAppSDK>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </MiniAppSDK>
            </FrameLoginProvider>
          </NonSSRWrapper>
        </ChakraProvider>
      </Web3ModalProvider>
    </QueryClientProvider>
  )
}
