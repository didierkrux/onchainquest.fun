import React from 'react'
import { Box, useMediaQuery } from '@chakra-ui/react'

import Menu from 'components/Menu'
import { useEventData } from 'hooks/useEventData'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobile] = useMediaQuery('(max-width: 48em)')
  const { event, error } = useEventData()

  return (
    <Box>
      <header>
        <Menu />
      </header>
      <main>
        <Box
          p="4"
          mb={isMobile ? 'calc(60px + env(safe-area-inset-bottom))' : 0}
          maxW="container.lg"
          mx="auto"
        >
          {event === null ? (
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
