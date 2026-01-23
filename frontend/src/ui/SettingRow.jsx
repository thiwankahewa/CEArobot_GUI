import * as React from "react";
import {
  Paper,
  Stack,
  Typography,
  Box,
  IconButton,
  Popover,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function SettingRow({ title, description, disabled, children }) {
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
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography sx={{ fontWeight: 600, fontSize: 16, flexGrow: 1 }} noWrap>
          {title}
        </Typography>

        <Box sx={{ pr: 7 }}>{children}</Box>
      </Stack>

      <IconButton
        size="small"
        onClick={handleOpen}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
        }}
        color="primary"
      >
        <InfoOutlinedIcon />
      </IconButton>

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
