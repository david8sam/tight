import React from 'react';
import { Alert, Button, Stack } from '@mui/material';

export default function LoadFailure({ retry, buttonRef }: { retry: () => void; buttonRef?: React.RefObject<HTMLButtonElement> }) {
    return <Stack spacing={2} sx={{ p: 2 }}>
        <Alert severity="error">Could not load this information. Check the host connection and try again.</Alert>
        <Button ref={buttonRef} onClick={retry}>Retry loading information</Button>
    </Stack>;
}
