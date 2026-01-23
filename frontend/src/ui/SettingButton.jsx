import * as React from "react";
import { Stack, Button, CircularProgress } from "@mui/material";
import SettingRow from "./SettingRow";
import { useAppSnackbar } from "./AppSnackbarProvider";

export default function SettingButton({
  title,
  description,
  buttonText = "Refresh",
  loadingText = "Refreshing...",
  disabled = false,
  onClick, // async function
}) {
  const snackbar = useAppSnackbar();
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;

    setLoading(true);
    try {
      const result = await onClick();

      if (typeof result === "string") {
        snackbar.success(result);
      } else if (result && typeof result === "object") {
        const severity = result.severity || (result.ok ? "success" : "error");
        const message = result.message || (result.ok ? "Done." : "Failed.");
        snackbar.show(severity, message);
      } else {
        snackbar.success("Done.");
      }
    } catch (err) {
      snackbar.error(err?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingRow title={title} description={description} disabled={disabled}>
      <Stack direction="row" alignItems="center">
        <Button
          variant="contained"
          onClick={handleClick}
          disabled={disabled || loading}
          sx={{
            borderRadius: 25,
            px: 3,
            py: 1.2,
            fontWeight: 700,
            minWidth: 160,
          }}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" /> : null
          }
        >
          {loading ? loadingText : buttonText}
        </Button>
      </Stack>
    </SettingRow>
  );
}
