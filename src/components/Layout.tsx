import React from 'react'
import { Box, useMediaQuery } from '@chakra-ui/react'
import Menu from './Menu'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobile] = useMediaQuery('(max-width: 48em)', { ssr: true })
  return (
    <Box>
      <header>
        <Menu />
      </header>
      <main>
        <Box p="4" mb={isMobile ? '64px' : 0} maxW="container.lg" mx="auto">
          {children}
        </Box>
      </main>
    </Box>
  )
}

export default Layout
