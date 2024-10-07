import Web3ModalProvider from 'context'
import type { AppProps } from 'next/app'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'

import Layout from 'components/Layout'
import theme from 'theme'
import 'utils/translation'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3ModalProvider>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ChakraProvider>
    </Web3ModalProvider>
  )
}
