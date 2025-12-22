import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import { AppSnackbarProvider } from "./utils/AppSnackbarProvider.jsx";
import { AppDialogProvider } from "./utils/AppDialogProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <AppSnackbarProvider>
        <AppDialogProvider>
          <CssBaseline />
          <App />
        </AppDialogProvider>
      </AppSnackbarProvider>
    </ThemeProvider>
  </React.StrictMode>
);
