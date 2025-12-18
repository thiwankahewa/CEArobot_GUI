import * as React from "react";
import { Stack, Card, CardContent, Typography, Divider, Grid, Paper, TextField, Button } from "@mui/material";

export default function PhenoPage() {
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Phenotype Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live view + gallery + metadata.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>Filters</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField size="small" label="Run ID / Bench ID" />
                  <TextField size="small" label="Plant ID" />
                  <TextField size="small" label="Date" placeholder="YYYY-MM-DD" />
                  <Button variant="contained">Apply</Button>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, minHeight: 360 }}>
                <Typography sx={{ fontWeight: 700 }}>Gallery / Live View</Typography>
                <Typography variant="body2" color="text.secondary">
                  TODO: thumbnails, band compare, quality metrics.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
