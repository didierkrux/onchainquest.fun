import { CardProps, Card as ChakraCard } from '@chakra-ui/react'

export function Card({
  highlighted = true,
  children,
  ...props
}: { highlighted?: boolean } & CardProps) {
  return (
    <ChakraCard
      variant={'outline'}
      borderColor={highlighted ? 'orange' : 'grey.400'}
      borderRadius="10px"
      bgColor="transparent"
      {...props}
    >
      {children}
    </ChakraCard>
  )
}
