import Web3ModalProvider from 'context'
import type { AppProps } from 'next/app'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import NextHead from 'next/head'
import { Global, css } from '@emotion/react'

import Layout from 'components/Layout'
import theme from 'theme'
import 'utils/translation'
import NonSSRWrapper from 'components/NonSSRWrapper'
import { MENU, eventName, DOMAIN_URL, eventDescription, IS_PROD } from 'config/index'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'

export default function MyApp({ Component, pageProps }: AppProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const menuIndex = router.pathname ? MENU.findIndex((item) => item.href === router.pathname) : 0
  const label = MENU[menuIndex]?.label || ''
  const title = label ? t(label) : ''
  const socialImage = `${DOMAIN_URL}/social.jpg`
  const url = `${DOMAIN_URL}${router.pathname}`
  const pageTitle = title ? `${title} | ${eventName}` : eventName
  const description = eventDescription
  const appIcon = `${DOMAIN_URL}/app-icon.png?v=1`
  const canonical = url?.split('?')[0]

  return (
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
          {IS_PROD && <link rel="shortcut icon" sizes="512x512" type="image/png" href={appIcon} />}
          <link rel="canonical" href={canonical} />
          <meta name="robots" content={IS_PROD ? 'all' : 'noindex'}></meta>
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
                padding-top: env(safe-area-inset-top);
                padding-right: env(safe-area-inset-right);
                padding-bottom: env(safe-area-inset-bottom);
                padding-left: env(safe-area-inset-left);
              }
              @font-face {
                font-family: 'NeueAugenblick';
                src: url(/fonts/NeueAugenblick-ExtraBold.ttf);
              }
              @font-face {
                font-family: 'Inter';
                src: url(/fonts/Inter-Regular.ttf);
              }
            `}
          />
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </NonSSRWrapper>
      </ChakraProvider>
    </Web3ModalProvider>
  )
}
