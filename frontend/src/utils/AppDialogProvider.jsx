import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

const AppDialogContext = React.createContext(null);

export function AppDialogProvider({ children }) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [actions, setActions] = React.useState([]);

  const close = React.useCallback(() => {
    setOpen(false);
  }, []);

  const showDialog = React.useCallback(({ title, content, actions }) => {
    setTitle(title);
    setContent(content);
    setActions(actions || []);
    setOpen(true);
  }, []);

  const api = React.useMemo(
    () => ({
      showDialog,
      close,
    }),
    [showDialog, close]
  );

  return (
    <AppDialogContext.Provider value={api}>
      {children}

      <Dialog open={open} onClose={close}>
        <DialogTitle>{title}</DialogTitle>

        <DialogContent dividers>
          {typeof content === "string" ? (
            <Typography>{content}</Typography>
          ) : (
            content
          )}
        </DialogContent>

        <DialogActions>
          {actions.map((a, idx) => (
            <Button
              key={idx}
              variant={a.variant || "text"}
              color={a.color || "primary"}
              onClick={() => {
                close();
                a.onClick?.();
              }}
            >
              {a.label}
            </Button>
          ))}
        </DialogActions>
      </Dialog>
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const ctx = React.useContext(AppDialogContext);
  if (!ctx) {
    throw new Error("useAppDialog must be used inside <AppDialogProvider>");
  }
  return ctx;
}
