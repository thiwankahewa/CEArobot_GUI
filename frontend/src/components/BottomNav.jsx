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
        width: "55%", // 2/3rd of the full length
        borderRadius: 25,
        overflow: "hidden",
        padding: 0.5,
      }}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, v) => onChange(v)}
        sx={{
          height: 64,
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            transition: "transform 0.5s ease",
          },
          "& .MuiBottomNavigationAction-root.Mui-selected": {
            transform: "scale(1.35)", //
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          icon={<HomeIcon />}
          sx={{ scale: 1.15 }}
        />
        <BottomNavigationAction
          label="Control"
          icon={<PlayCircleIcon />}
          sx={{ scale: 1.15 }}
        />
        <BottomNavigationAction
          label="Pheno"
          icon={<PhotoCameraIcon />}
          sx={{ scale: 1.15 }}
        />
        <BottomNavigationAction
          label="Settings"
          icon={<SettingsIcon />}
          sx={{ scale: 1.15 }}
        />
        <BottomNavigationAction
          label="Logs"
          icon={<ListAltIcon />}
          sx={{ scale: 1.15 }}
        />
      </BottomNavigation>
    </Paper>
  );
}
