import { Box, Image } from '@chakra-ui/react'

interface AvatarProps {
  src: string
  width?: string
  [key: string]: any
}

export function Avatar({ src, width = '40px', ...props }: AvatarProps) {
  const isTwemoji = src?.includes('/twemoji')
  return (
    <Box borderRadius={isTwemoji ? '0' : 'full'} overflow="hidden" w={width} {...props}>
      <Image src={src} w="100%" h="auto" p={isTwemoji ? 1 : 0} />
    </Box>
  )
}
