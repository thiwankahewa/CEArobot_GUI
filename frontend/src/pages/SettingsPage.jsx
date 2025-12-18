import * as React from "react";
import { Stack, Card, CardContent, Typography, Divider, Grid, Paper, TextField, Button, Switch, FormControlLabel } from "@mui/material";

export default function SettingsPage() {
  const [admin, setAdmin] = React.useState(false);

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <div>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lock writes unless robot is IDLE + Admin enabled.
              </Typography>
            </div>
            <FormControlLabel
              control={<Switch checked={admin} onChange={(e) => setAdmin(e.target.checked)} />}
              label="Admin"
            />
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>Connection</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField size="small" label="ROSBridge URL" defaultValue="ws://192.168.1.42:9090" />
                  <Button variant="contained">Reconnect</Button>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>Robot Limits</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField size="small" label="Max linear (m/s)" defaultValue="0.4" />
                  <TextField size="small" label="Max angular (rad/s)" defaultValue="1.0" />
                  <Button variant="contained" disabled={!admin}>Save</Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
