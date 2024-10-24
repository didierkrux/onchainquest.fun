import { Tabs, TabList, Tab } from '@chakra-ui/react'

interface SelectTabProps {
  tabLabels: string[]
  selectedIndex: number
  onTabChange: (index: number) => void
  colorScheme?: string
}

export default function SelectTab({
  tabLabels,
  selectedIndex,
  onTabChange,
  colorScheme = 'gray',
}: SelectTabProps) {
  return (
    <Tabs
      variant="soft-rounded"
      border="1px solid gray"
      borderRadius="full"
      colorScheme={colorScheme}
      defaultIndex={selectedIndex}
      onChange={onTabChange}
    >
      <TabList>
        {tabLabels.map((label, index) => (
          <Tab key={index} minW="100px">
            {label}
          </Tab>
        ))}
      </TabList>
    </Tabs>
  )
}
