import { CardProps, Card as ChakraCard } from '@chakra-ui/react'

export function Card({
  highlight = true,
  children,
  ...props
}: { highlight?: boolean } & CardProps) {
  return (
    <ChakraCard
      variant={'outline'}
      borderColor={highlight ? 'orange' : 'grey.400'}
      borderRadius="10px"
      bgColor="transparent"
      {...props}
    >
      {children}
    </ChakraCard>
  )
}
