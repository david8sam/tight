import React, { HTMLAttributes, ReactNode } from 'react';

import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { GameFaction } from 'common/Game';

import { getFactionColors } from '../../utils/faction';

interface FactionColorChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
    faction: GameFaction;
    /** Dot diameter in px */
    size?: number;
    /** Optional label rendered next to the dot */
    label?: ReactNode;
}

const useStyles = makeStyles<{ dotColor: string; size: number }>()((theme, { dotColor, size }) => ({
    root: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(0.875),
        minWidth: 0,
    },
    dot: {
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: dotColor,
        flexShrink: 0,
    },
    label: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
}));

function FactionColorChip({ faction, size = 9, label, className, ...rest }: FactionColorChipProps) {
    const theme = useTheme();
    const { readable } = getFactionColors(theme, faction);
    const { classes, cx } = useStyles({ dotColor: readable, size });

    return (
        <span className={cx(classes.root, className)} {...rest}>
            <span className={classes.dot} />
            {label && <span className={classes.label}>{label}</span>}
        </span>
    );
}

export default FactionColorChip;
