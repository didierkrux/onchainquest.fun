import { extendTheme, localStorageManager, ThemeConfig, withDefaultColorScheme } from "@chakra-ui/react"

localStorageManager.set('light')

const config: ThemeConfig = {
  initialColorMode: "light",
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
    Card: {
      baseStyle: {
        borderRadius: '10px',
      },
      variants: {
        outline: {
          border: '1px solid #FF7614', // orange 1px border for outline variant
        },
      },
    },
  },
  colors: {
    purple: {
      500: "#3D154C", // deep purple
      600: "#5F177A", // medium purple
    },
    orange: "#FF7614", // orange
    salmon: "#CD577E", // salmon
    background: "#E3D7C9", // light gray
  },
},
  withDefaultColorScheme({ colorScheme: 'purple' })
)

export default theme
