import { extendTheme, ThemeConfig, withDefaultColorScheme } from "@chakra-ui/react"

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
  withDefaultColorScheme({ colorScheme: 'red' })
)

export default theme
