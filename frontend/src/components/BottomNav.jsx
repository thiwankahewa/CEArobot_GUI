import * as React from "react";
import { Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SettingsIcon from "@mui/icons-material/Settings";
import ListAltIcon from "@mui/icons-material/ListAlt";
import BuildIcon from "@mui/icons-material/Build";

export default function BottomNav({ value, onChange }) {
  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        bottom: 10,
        left: "50%",
        transform: "translateX(-50%)",
        width: "50%", // 2/3rd of the full length
        borderRadius: 25,
        overflow: "hidden",
      }}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, v) => onChange(v)}
        sx={{
          height: 64,
          "& .MuiBottomNavigationAction-root": { minWidth: 0 },
        }}
      >
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="Run" icon={<PlayCircleIcon />} />
        <BottomNavigationAction label="Pheno" icon={<PhotoCameraIcon />} />
        <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
        <BottomNavigationAction label="Logs" icon={<ListAltIcon />} />
        <BottomNavigationAction label="Test" icon={<BuildIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
