import { useState } from 'react';

import { TooltipProps } from '@mui/material';

export default function useTooltipOnClick(options?: {
    onTooltipOpen?: (...params: any) => any;
    onTooltipClose?: TooltipProps['onClose'];
}): [boolean, () => void, TooltipProps['onClose']] {
    const [open, setOpen] = useState(false);
    const { onTooltipClose, onTooltipOpen } = options || {};

    const onOpen = (...params: any): any => {
        setOpen(true);
        if (onTooltipOpen) {
            onTooltipOpen(...params);
        }
    };

    const onClose: TooltipProps['onClose'] = e => {
        setOpen(false);
        if (onTooltipClose) {
            onTooltipClose(e);
        }
    };

    return [open, onOpen, onClose];
}
