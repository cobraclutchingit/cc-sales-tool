import { extendTheme } from '@chakra-ui/react';

// ClickUp-inspired color palette
const colors = {
  brand: {
    primary: '#7B68EE', // ClickUp's main purple color
    secondary: '#8E84FF', // Light purple for hover states
    primaryLight: '#EAE6FF', // Very light purple for backgrounds
    accent: '#FF5722', // Accent color for highlights
    success: '#4DB76A', // Green for success states
    warning: '#FFB300', // Yellow/amber for warnings
    error: '#F44336', // Red for errors
    background: {
      light: '#FFFFFF',
      dark: '#1E1F21'
    },
    navbar: {
      light: '#FBFBFB',
      dark: '#2C2C2E'
    },
    sidebar: {
      light: '#F7F7F7',
      dark: '#282829'
    },
    card: {
      light: '#FFFFFF',
      dark: '#363639'
    }
  },
  linkedin: {
    100: '#E8F4F9',
    500: '#0077B5',
    900: '#004471'
  },
  gray: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923',
  },
};

// ClickUp-inspired fonts
const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
};

// ClickUp-inspired component styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: '600',
      borderRadius: '4px',
    },
    variants: {
      primary: {
        bg: 'brand.primary',
        color: 'white',
        _hover: {
          bg: 'brand.secondary',
        },
      },
      secondary: {
        bg: 'transparent',
        border: '1px solid',
        borderColor: 'brand.primary',
        color: 'brand.primary',
        _hover: {
          bg: 'rgba(123, 104, 238, 0.1)',
        },
      },
      tertiary: {
        bg: 'transparent',
        color: 'brand.primary',
        _hover: {
          bg: 'rgba(123, 104, 238, 0.1)',
        },
      },
    },
    defaultProps: {
      variant: 'primary',
    },
  },
  Input: {
    baseStyle: {
      field: {
        borderRadius: '4px',
      },
    },
    variants: {
      outline: {
        field: {
          border: '1px solid',
          borderColor: 'gray.300',
          _focus: {
            borderColor: 'brand.primary',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary)',
          },
        },
      },
    },
    defaultProps: {
      variant: 'outline',
    },
  },
  Tabs: {
    variants: {
      line: {
        tab: {
          fontWeight: '600',
          _selected: {
            color: 'brand.primary',
            borderColor: 'brand.primary',
          },
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        p: '6',
      },
    },
  },
};

// Global styles
const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'brand.background.dark' : 'brand.background.light',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
    },
  }),
};

// ClickUp-inspired theme config
const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Construct the theme
const theme = extendTheme({
  colors,
  fonts,
  components,
  styles,
  config,
});

export default theme;