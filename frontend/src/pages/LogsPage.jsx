import * as React from "react";
import { Stack, Card, CardContent, Typography, Divider, Paper, TextField, Button, Box } from "@mui/material";

export default function LogsPage() {
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Filter /rosout or backend logs.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField size="small" label="Filter" placeholder="error | warn | node_name" fullWidth />
              <Button variant="contained">Apply</Button>
            </Stack>

            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                borderRadius: 2,
                bgcolor: "grey.900",
                color: "grey.100",
                overflow: "auto",
                maxHeight: 420,
                fontSize: 12,
              }}
            >
{`[INFO] bringup: Started
[WARN] camera_node: Frame drop detected
[ERROR] motor_driver: Overcurrent fault (example)
TODO: stream logs from /rosout or backend`}
            </Box>
          </Paper>
        </CardContent>
      </Card>
    </Stack>
  );
}
