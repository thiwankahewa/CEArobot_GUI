import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          outline: "none",
          "&.Mui-focusVisible": { outline: "none" },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          outline: "none",
          "&.Mui-focusVisible": { outline: "none" },
        },
      },
    },
  },
});

export default theme;
