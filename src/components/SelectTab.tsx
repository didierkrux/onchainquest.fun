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
      borderRadius="full"
      colorScheme={colorScheme}
      defaultIndex={selectedIndex}
      onChange={onTabChange}
      background="#F4EADE !important"
    >
      <TabList>
        {tabLabels.map((label, index) => (
          <Tab
            key={index}
            minW="100px"
            style={{ color: '#5F177AAB' }}
            _selected={{
              color: '#5F177A !important',
              border: '1px solid #5F177A !important',
              borderRadius: 'full',
              background: '#FBF5EE !important',
            }}
          >
            {label}
          </Tab>
        ))}
      </TabList>
    </Tabs>
  )
}
