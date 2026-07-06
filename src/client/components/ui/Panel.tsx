import React, { HTMLAttributes } from 'react';

import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
    /** Accent color for the left border (e.g. a faction color) */
    accent?: string;
    /** Emphasis ring for the active/highlighted panel — requires `accent` */
    glow?: boolean;
    /** Fade the panel for passed/exhausted states */
    dimmed?: boolean;
}

const useStyles = makeStyles<Pick<PanelProps, 'accent' | 'glow' | 'dimmed'>>()((theme, { accent, glow, dimmed }) => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.game.radius.card,
        padding: theme.spacing(1.5),
        ...(accent && { borderLeft: `3px solid ${accent}` }),
        ...(accent && glow && { boxShadow: `0 0 0 1px ${alpha(accent, 0.35)}` }),
        ...(dimmed && { opacity: theme.game.opacity.passed }),
    },
}));

function Panel({ accent, glow, dimmed, className, children, ...rest }: PanelProps) {
    const { classes, cx } = useStyles({ accent, glow, dimmed });

    return (
        <div className={cx(classes.root, className)} {...rest}>
            {children}
        </div>
    );
}

export default Panel;
