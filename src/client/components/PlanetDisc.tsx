import React, { useEffect, useState } from 'react';

import { alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';

import { planetImageUrl } from '../utils/assets';

interface PlanetDiscProps {
    /** Planet display name (slugified for the image lookup) */
    name: string;
    /** Disc diameter in px */
    size?: number;
    /** Fallback disc color when no image exists (e.g. the planet's trait color) */
    fallbackColor?: string;
    className?: string;
}

const useStyles = makeStyles<{ size: number; fallbackColor?: string }>()((theme, { size, fallbackColor }) => {
    const base = fallbackColor ?? theme.palette.text.disabled;

    return {
        root: {
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'inline-flex',
            flexShrink: 0,
            backgroundColor: alpha(base, 0.22),
            border: `1px solid ${alpha(base, 0.55)}`,
        },
        img: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
        },
    };
});

/**
 * Optional planet artwork (see src/client/public/ti4/README.md). Falls back to a flat disc in
 * the given color when the image is absent, so rows keep consistent alignment either way.
 */
function PlanetDisc({ name, size = 26, fallbackColor, className }: PlanetDiscProps) {
    const { classes, cx } = useStyles({ size, fallbackColor });
    const [src, setSrc] = useState<string | null>(() => planetImageUrl(name));

    useEffect(() => {
        setSrc(planetImageUrl(name));
    }, [name]);

    return (
        <span className={cx(classes.root, className)}>
            {src && <img className={classes.img} src={src} alt="" onError={() => setSrc(null)} />}
        </span>
    );
}

export default PlanetDisc;
