import * as React from "react";
import { Snackbar, Alert } from "@mui/material";

const AppSnackbarContext = React.createContext(null);

export function AppSnackbarProvider({ children }) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [severity, setSeverity] = React.useState("info"); // info|success|warning|error
  const [duration, setDuration] = React.useState(2500);

  const show = React.useCallback((sev, msg, opts = {}) => {
    setSeverity(sev);
    setMessage(msg);
    setDuration(opts.duration ?? 2500);

    // force re-open even if it was already open
    setOpen(false);
    setTimeout(() => setOpen(true), 0);
  }, []);

  const api = React.useMemo(
    () => ({
      show,
      info: (msg, opts) => show("info", msg, opts),
      success: (msg, opts) => show("success", msg, opts),
      warning: (msg, opts) => show("warning", msg, opts),
      error: (msg, opts) => show("error", msg, opts),
      close: () => setOpen(false),
    }),
    [show]
  );

  return (
    <AppSnackbarContext.Provider value={api}>
      {children}

      {/* Global Snackbar */}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setOpen(false);
        }}
        sx={{
          "&.MuiSnackbar-anchorOriginBottomCenter": {
            bottom: 6, // px
          },
        }}
      >
        <Alert
          severity={severity}
          onClose={() => setOpen(false)}
          sx={{
            fontWeight: 600,
            borderRadius: 20,
            padding: 2.2,
            fontSize: 18,
            width: 752,
            "& .MuiAlert-message": {
              width: "100%",
              textAlign: "center",
            },
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </AppSnackbarContext.Provider>
  );
}

export function useAppSnackbar() {
  const ctx = React.useContext(AppSnackbarContext);
  if (!ctx) {
    throw new Error("useAppSnackbar must be used inside <AppSnackbarProvider>");
  }
  return ctx;
}
