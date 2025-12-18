import * as React from "react";
import { Stack, Grid, Card, CardContent, Typography, Button, Paper, Divider, List, ListItem, ListItemText } from "@mui/material";

export default function HomePage() {
  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        {[
          { title: "Robot State", value: "IDLE", hint: "Ready for mission" },
          { title: "Localization", value: "OK", hint: "Map + pose stable" },
          { title: "Cameras", value: "2/2", hint: "Streams alive" },
          { title: "Storage", value: "71% free", hint: "SSD healthy" },
        ].map((t) => (
          <Grid key={t.title} item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  {t.title}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {t.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.hint}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Quick Actions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Common workflows (add safety checks here).
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            {[
              { title: "Manual Teleop", desc: "Drive + steering test", btn: "Open Run" },
              { title: "Phenotyping Run", desc: "Capture sequence + metadata", btn: "Open Pheno" },
              { title: "Maintenance/Test", desc: "Sensors + actuators + IO", btn: "Open Test" },
              { title: "View Logs", desc: "Warnings, errors, history", btn: "Open Logs" },
            ].map((c) => (
              <Grid key={c.title} item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <div>
                      <Typography sx={{ fontWeight: 700 }}>{c.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {c.desc}
                      </Typography>
                    </div>
                    <Button variant="contained">{c.btn}</Button>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Alerts / Recent Events
          </Typography>
          <List dense>
            {[
              { primary: "No active faults", secondary: "All systems nominal" },
              { primary: "Last capture run", secondary: "Run_2025-12-18_01 completed (120 images)" },
              { primary: "Motor driver", secondary: "Heartbeat OK" },
            ].map((i, idx) => (
              <ListItem key={idx} disableGutters>
                <ListItemText primary={i.primary} secondary={i.secondary} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
}
