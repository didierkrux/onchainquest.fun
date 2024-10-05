import Web3ModalProvider from 'context'
import type { AppProps } from 'next/app'
import { ChakraProvider } from '@chakra-ui/react'

import 'globals.css'
import Layout from 'components/Layout'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3ModalProvider>
      <ChakraProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ChakraProvider>
    </Web3ModalProvider>
  )
}
