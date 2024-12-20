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
      body: {
        backgroundColor: '#fbf5ee',
      },
      a: {
        color: "#3182ce",
        _hover: {
          textDecoration: "underline",
        },
      },
      h1: {
        fontFamily: 'NeueAugenblick !important',
        color: '#5F177A !important',
      },
      h2: {
        fontFamily: 'Inter !important',
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
    // orange: "#FF7614", // orange
    salmon: "#CD577E", // salmon
    // background: "#fbf5ee", // light gray
  },
},
  withDefaultColorScheme({ colorScheme: 'purple' })
)

export default theme
