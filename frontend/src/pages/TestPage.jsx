import * as React from "react";
import { Stack, Card, CardContent, Typography, Divider, Grid, Paper, List, ListItem, ListItemText, Button } from "@mui/material";

export default function TestPage() {
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Test / Diagnostics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live sensors + actuator jog + self-tests.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>Sensors</Typography>
                <List dense>
                  <ListItem disableGutters>
                    <ListItemText primary="ToF Left" secondary="312 mm (OK) • 50ms ago" />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText primary="ToF Right" secondary="298 mm (OK) • 45ms ago" />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText primary="IMU" secondary="Yaw 12.4° • 30ms ago" />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText primary="Camera" secondary="FPS 28 • OK" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>Actuators</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Button variant="outlined">Jog Lift Up</Button>
                  <Button variant="outlined">Jog Lift Down</Button>
                  <Button variant="outlined">Steer Center</Button>
                  <Button variant="contained" color="error">
                    Disable Motors
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>Self Tests</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Button variant="contained">Run Health Check</Button>
                  <Button variant="outlined">Record Rosbag</Button>
                  <Button variant="outlined">LED Relay Test</Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
