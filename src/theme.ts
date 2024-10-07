import { extendTheme, localStorageManager, ThemeConfig, withDefaultColorScheme } from "@chakra-ui/react"

localStorageManager.set('dark')

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  styles: {
    global: {
      a: {
        color: "#3182ce",
        _hover: {
          textDecoration: "underline",
        },
      },
    },
  },
  components: {
    Link: {
      baseStyle: {
        color: "#3182ce",
        _hover: {
          textDecoration: "underline",
        },
      },
    },
  },
},
  withDefaultColorScheme({ colorScheme: 'orange' })
)

export default theme
