import React from 'react'
import { Box, useMediaQuery } from '@chakra-ui/react'
import NextHead from 'next/head'

import Menu from 'components/Menu'
import { useEventData } from 'hooks/useEventData'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobile] = useMediaQuery('(max-width: 48em)', { ssr: true })
  const { event, error } = useEventData()

  return (
    <Box>
      <NextHead>
        <title>Start here</title>
        {/* Progressive Web App */}
        <link rel="apple-touch-icon" href="/app-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Start here" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="manifest" crossOrigin="use-credentials" href="/manifest.json" />
      </NextHead>
      <header>
        <Menu />
      </header>
      <main>
        <Box p="4" mb={isMobile ? '64px' : 0} maxW="container.lg" mx="auto">
          {!event ? (
            <Box>Loading...</Box>
          ) : error ? (
            <Box>Error: {error.message}</Box>
          ) : (
            React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, { event })
              }
              return child
            })
          )}
        </Box>
      </main>
    </Box>
  )
}

export default Layout
