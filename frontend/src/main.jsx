import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import { AppSnackbarProvider } from "./ui/AppSnackbarProvider.jsx";
import { AppDialogProvider } from "./ui/AppDialogProvider.jsx";
import { LogsProvider } from "./ui/LogsProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LogsProvider>
      <ThemeProvider theme={theme}>
        <AppSnackbarProvider>
          <AppDialogProvider>
            <CssBaseline />
            <App />
          </AppDialogProvider>
        </AppSnackbarProvider>
      </ThemeProvider>
    </LogsProvider>
  </React.StrictMode>
);
