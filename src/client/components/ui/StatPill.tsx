import React, { HTMLAttributes, ReactNode } from 'react';

import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

type StatPillVariant = 'tint' | 'solid' | 'outlined';
type StatPillSize = 'small' | 'medium';

interface StatPillProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
    /** Base color driving the pill; defaults to the theme's secondary text color */
    color?: string;
    variant?: StatPillVariant;
    size?: StatPillSize;
    icon?: ReactNode;
    children: ReactNode;
}

interface StyleParams {
    color?: string;
    variant: StatPillVariant;
    size: StatPillSize;
}

const useStyles = makeStyles<StyleParams>()((theme, { color, variant, size }) => {
    const base = color ?? theme.palette.text.secondary;

    return {
        root: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: theme.spacing(0.75),
            borderRadius: theme.game.radius.pill,
            fontSize: size === 'small' ? 11 : 12.5,
            fontWeight: 500,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            padding: size === 'small' ? theme.spacing(0.375, 1.125) : theme.spacing(0.625, 1.5),
            ...(variant === 'tint' && { backgroundColor: alpha(base, 0.14), color: base }),
            ...(variant === 'solid' && { backgroundColor: base, color: theme.palette.getContrastText(base) }),
            ...(variant === 'outlined' && { border: `1px solid ${alpha(base, 0.4)}`, color: base }),
        },
        icon: {
            display: 'inline-flex',
            alignItems: 'center',
        },
    };
});

function StatPill({ color, variant = 'tint', size = 'medium', icon, className, children, ...rest }: StatPillProps) {
    const { classes, cx } = useStyles({ color, variant, size });

    return (
        <span className={cx(classes.root, className)} {...rest}>
            {icon && <span className={classes.icon}>{icon}</span>}
            {children}
        </span>
    );
}

export default StatPill;
