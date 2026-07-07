import React, { useEffect, useState } from 'react';

import { makeStyles } from 'tss-react/mui';

import { factionImageUrl } from '../utils/assets';

interface FactionSigilProps {
    /** Faction display name (slugified for the image lookup) */
    name: string;
    /** Sigil size in px */
    size?: number;
    /** Faction tint for the backing chip (keeps light/dark sigils visible on both themes) */
    tint?: string;
    className?: string;
}

const useStyles = makeStyles<{ size: number; tint?: string }>()((theme, { size, tint }) => ({
    root: {
        width: size,
        height: size,
        borderRadius: theme.game.radius.control,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: tint,
    },
    img: {
        width: '82%',
        height: '82%',
        objectFit: 'contain',
    },
}));

/**
 * Optional faction artwork (see src/client/public/ti4/README.md). Renders nothing when the
 * image is absent — art is a progressive enhancement, never required.
 */
function FactionSigil({ name, size = 26, tint, className }: FactionSigilProps) {
    const { classes, cx } = useStyles({ size, tint });
    const [src, setSrc] = useState<string | null>(() => factionImageUrl(name));

    useEffect(() => {
        setSrc(factionImageUrl(name));
    }, [name]);

    if (!src) {
        return null;
    }

    return (
        <span className={cx(classes.root, className)}>
            <img className={classes.img} src={src} alt="" onError={() => setSrc(null)} />
        </span>
    );
}

export default FactionSigil;
