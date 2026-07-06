import React, { HTMLAttributes } from 'react';

import { makeStyles } from 'tss-react/mui';

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
    /** Max content width in px, or false for full width */
    maxWidth?: number | false;
}

const useStyles = makeStyles<{ maxWidth: number | false }>()((theme, { maxWidth }) => ({
    root: {
        width: '100%',
        margin: '0 auto',
        padding: theme.spacing(2),
        [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(1.5, 1),
        },
        ...(maxWidth && { maxWidth }),
    },
}));

function PageContainer({ maxWidth = 1200, className, children, ...rest }: PageContainerProps) {
    const { classes, cx } = useStyles({ maxWidth });

    return (
        <div className={cx(classes.root, className)} {...rest}>
            {children}
        </div>
    );
}

export default PageContainer;
