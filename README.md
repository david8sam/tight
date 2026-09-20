# TIGHT

## Twilight Imperium Game Helper and Tracker

# Build and Run

### Prerequisites

For HTTPS, set environment variables for the paths to key and crt files:

- SSL_TIGHT_KEY_PATH
- SSL_TIGHT_CRT_PATH

To use HTTP instead, set the environment variable TIGHT_USE_HTTP=true.

### 1. Install node modules

`npm i`

Note: Add `--legacy-peer-deps` flag if dealing with dependency version conflicts

### 2. Build server and client

`npm run build`

### 3. Run server

`npm run start`

Server URL will be printed in the console.

# Run Dev

## Run each of the following commands in their own separate console.

### 1. Run server in dev:

`npm run start:dev`

Sometimes changes to server files don't hot reload correctly. Run `rs` in this console to restart the server.

### 2. Build and watch server in dev

`npm run server:dev`

### 3. Build and watch client in dev:

`npm run client:dev`

Access the client at https://localhost:3001/
