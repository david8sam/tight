import React, { HTMLAttributes, ReactNode } from 'react';

import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

export type PhaseBadgeState = 'complete' | 'active' | 'pending';

interface PhaseBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    label: string;
    state?: PhaseBadgeState;
    icon?: ReactNode;
}

const useStyles = makeStyles<{ state: PhaseBadgeState }>()((theme, { state }) => ({
    root: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
        borderRadius: theme.game.radius.pill,
        fontFamily: '"Orbitron", sans-serif',
        fontSize: 11,
        letterSpacing: '0.05em',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        padding: theme.spacing(0.5, 1.25),
        ...(state === 'complete' && {
            backgroundColor: alpha(theme.palette.success.main, 0.14),
            color: theme.palette.success.main,
        }),
        ...(state === 'active' && {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            fontWeight: 600,
        }),
        ...(state === 'pending' && {
            backgroundColor: alpha(theme.palette.text.secondary, 0.12),
            color: theme.palette.text.secondary,
        }),
    },
    icon: {
        display: 'inline-flex',
        alignItems: 'center',
    },
}));

function PhaseBadge({ label, state = 'pending', icon, className, ...rest }: PhaseBadgeProps) {
    const { classes, cx } = useStyles({ state });

    return (
        <span className={cx(classes.root, className)} {...rest}>
            {icon && <span className={classes.icon}>{icon}</span>}
            {label}
        </span>
    );
}

export default PhaseBadge;
