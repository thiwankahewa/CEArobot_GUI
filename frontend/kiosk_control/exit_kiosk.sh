#!/usr/bin/env bash
set -e

# Stop Firefox kiosk cleanly
systemctl --user stop ceabot_kiosk.service || true

# Fallback in case Firefox didn't exit
pkill -f "firefox.*--kiosk" || true
