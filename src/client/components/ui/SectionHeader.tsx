import React, { HTMLAttributes } from 'react';

import { makeStyles } from 'tss-react/mui';

interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const useStyles = makeStyles()(theme => ({
    root: {
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: theme.palette.text.secondary,
    },
}));

function SectionHeader({ className, children, ...rest }: SectionHeaderProps) {
    const { classes, cx } = useStyles();

    return (
        <div className={cx(classes.root, className)} {...rest}>
            {children}
        </div>
    );
}

export default SectionHeader;
