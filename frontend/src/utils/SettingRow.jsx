import * as React from "react";
import {
  Paper,
  Stack,
  Typography,
  Box,
  IconButton,
  Popover,
  Button,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function SettingRow({
  title,
  description,
  right,
  disabled,
  children,
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        opacity: disabled ? 0.6 : 1,
        position: "relative",
      }}
    >
      {description && (
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
          }}
        >
          <InfoOutlinedIcon />
        </IconButton>
      )}

      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ flex: 1, minWidth: 0, pr: 7 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 16 }} noWrap>
            {title}
          </Typography>

          <Box sx={{ mt: 1 }}>{children}</Box>
        </Box>
        {right ? <Box sx={{ flexShrink: 0 }}>{right}</Box> : null}
      </Stack>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
            {description}
          </Typography>
        </Box>
      </Popover>
    </Paper>
  );
}
