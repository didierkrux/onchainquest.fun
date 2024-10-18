import { Box, Image } from '@chakra-ui/react'

interface AvatarProps {
  src: string
  w?: string
}

export function Avatar({ src, w = '40px' }: AvatarProps) {
  const isTwemoji = src.includes('/twemoji')
  return (
    <Box borderRadius={isTwemoji ? '0' : 'full'} overflow="hidden" w={w}>
      <Image src={src} h="auto" p={isTwemoji ? 1 : 0} />
    </Box>
  )
}
