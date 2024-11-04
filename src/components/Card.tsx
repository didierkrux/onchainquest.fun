import { CardProps, Card as ChakraCard } from '@chakra-ui/react'

export function Card({
  type = 'default',
  children,
  ...props
}: { type?: 'orange' | 'transparent' | 'default' } & CardProps) {
  return (
    <ChakraCard
      variant={'outline'}
      borderColor={
        type === 'orange' ? '#FF7614' : type === 'transparent' ? 'transparent' : '#F4EADE'
      }
      borderWidth={type === 'orange' ? '1px' : type === 'transparent' ? '0px' : '2px'}
      borderRadius="10px"
      bgColor={'transparent'}
      {...props}
    >
      {children}
    </ChakraCard>
  )
}
