import Web3ModalProvider from 'context'
import type { AppProps } from 'next/app'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import NextHead from 'next/head'

import Layout from 'components/Layout'
import theme from 'theme'
import 'utils/translation'
import NonSSRWrapper from 'components/NonSSRWrapper'
import { MENU, eventName } from 'config/index'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'

export default function MyApp({ Component, pageProps }: AppProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const menuIndex = router.pathname ? MENU.findIndex((item) => item.href === router.pathname) : 0
  const label = MENU[menuIndex]?.label || ''
  const title = label ? t(label) : ''

  return (
    <Web3ModalProvider>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <NextHead>
          <title>{title ? `${title} | ${eventName}` : eventName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          {/* Progressive Web App */}
          <link rel="apple-touch-icon" href="/app-icon.png" />
          <meta name="apple-mobile-web-app-title" content={eventName} />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black" />
          <link rel="manifest" crossOrigin="use-credentials" href="/manifest.json" />
        </NextHead>
        <NonSSRWrapper>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </NonSSRWrapper>
      </ChakraProvider>
    </Web3ModalProvider>
  )
}
