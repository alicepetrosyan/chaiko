// theme.js
import { createTheme } from "@mui/material/styles";

// Shared palette
const palette = {
  background: {
    default: '#dfd6c0ff',
  },
  mode: 'light',
  contrastColor: '#dfd6c0ff',
  link: '#8bddcdff',
  logoColor1: '#dfd6c0ff',
  alarm: '#cb88a8ff',
  disabled: 'rgb(155, 150, 163)',
  periwinkle: {
    main: '#898dd6ff',
    light: '#b8bbfaff',
    dark: '#6860bdff',
  },
};

// Light theme
export const theme = createTheme({
  palette,
});

// Dark theme
export const darkTheme = createTheme({
  palette: {
    ...palette,
    mode: 'dark',
  },
  components: {
    MuiAutocomplete: {
      defaultProps: {
        slotProps: {
          paper: {
            sx: {
              filter: "none",
              backgroundColor: palette.periwinkle.main, // Use shared palette
              color: palette.periwinkle.dark, // Text color for dropdown
              boxShadow: "none",
            },
          },
          listbox: {
            sx: {
              color: palette.periwinkle.dark, // Text color for options
              '& .MuiAutocomplete-option': {
                transition: 'all 0.1s',
                color: palette.periwinkle.main, // Default option text color
                backgroundColor: palette.contrastColor, // Default option background
                margin: 0.75,
                borderRadius: 1,
                '&:hover': {
                  color: palette.contrastColor, // Hover text color
                  backgroundColor: palette.periwinkle.dark, // Hover background color
                },
                '&[aria-selected="true"]': {
                  backgroundColor: palette.alarm, // Selected item background color
                  color: palette.contrastColor, // Selected item text color
                },
                '&[data-focus="true"]': {
                  backgroundColor: palette.alarm, // Focused item background color
                  color: palette.contrastColor, // Focused item text color
                },
              },
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: palette.contrastColor,
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: 'Comfortaa',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: 'Comfortaa',
          '&.Mui-focused': {
            color: palette.contrastColor,
          },
        },
      },
    },
  },
});

export default theme;