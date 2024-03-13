import React, { MouseEvent, useRef, useState } from 'react';

import LanguageIcon from '@mui/icons-material/Language';
import { Avatar, AvatarProps, Popover, Typography, colors, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyle = makeStyles(theme => ({
    root: {
        height: 24,
        width: 24,
    },
    title: {
        padding: theme.spacing(),
    },
    popoverPaper: {
        marginTop: theme.spacing(),
    },
}));

function useIcon(name: string) {
    const [icon, setIcon] = useState('');
    import(`../assets/ti4/${name}.png`).then(i => setIcon(i.default)).catch(() => setIcon(''));

    return icon;
}

interface PlanetIconProps extends AvatarProps {
    classes?: object;
    color?: string;
    backgroundColor?: string;
    title?: string;
    hideTitle?: boolean;
}

function PlanetIcon(props: PlanetIconProps) {
    const classes = useStyle(props);
    const { children, color, backgroundColor, title, hideTitle, ...otherProps } = props;
    const [open, setOpen] = useState(false);
    const avatarRef = useRef<HTMLDivElement>(null);

    const onClick = (e: MouseEvent<HTMLDivElement>) => {
        if (hideTitle) {
            return;
        }

        e.stopPropagation();
        setOpen(true);
    };

    return (
        <>
            <Avatar
                {...otherProps}
                ref={avatarRef}
                className={classes.root}
                style={{ color, backgroundColor }}
                variant="square"
                onClick={hideTitle ? undefined : onClick}
            >
                {children}
            </Avatar>
            <Popover
                open={Boolean(title) && open}
                onClose={() => setOpen(false)}
                anchorEl={avatarRef.current}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                onClick={e => e.stopPropagation()}
                PaperProps={{ className: classes.popoverPaper }}
            >
                <Typography className={classes.title}>{title}</Typography>
            </Popover>
        </>
    );
}

export function Resources(props: PlanetIconProps) {
    const theme = useTheme();
    const backgroundColor = colors.deepOrange[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon title="Resources" color={color} backgroundColor={backgroundColor} {...props}>
            R
        </PlanetIcon>
    );
}

export function Influence(props: PlanetIconProps) {
    const theme = useTheme();
    const backgroundColor = colors.deepPurple[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon title="Influence" color={color} backgroundColor={backgroundColor} {...props}>
            I
        </PlanetIcon>
    );
}

export function Biotic(props: PlanetIconProps) {
    const src = useIcon('biotic');
    const theme = useTheme();
    const backgroundColor = colors.green[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon title="Biotic" color={color} backgroundColor={backgroundColor} {...props} src={src}>
            B
        </PlanetIcon>
    );
}

export function Warfare(props: PlanetIconProps) {
    const src = useIcon('warfare');
    const theme = useTheme();
    const backgroundColor = colors.red[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon title="Warfare" color={color} backgroundColor={backgroundColor} {...props} src={src}>
            W
        </PlanetIcon>
    );
}

export function Propulsion(props: PlanetIconProps) {
    const src = useIcon('propulsion');
    const theme = useTheme();
    const backgroundColor = colors.blue[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon title="Propulsion" color={color} backgroundColor={backgroundColor} {...props} src={src}>
            P
        </PlanetIcon>
    );
}

export function Cybernetic(props: PlanetIconProps) {
    const src = useIcon('cybernetic');
    const theme = useTheme();
    const backgroundColor = colors.yellow[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon title="Cybernetic" color={color} backgroundColor={backgroundColor} {...props} src={src}>
            C
        </PlanetIcon>
    );
}

export function Legendary(props: PlanetIconProps) {
    const src = useIcon('legendary');
    const theme = useTheme();
    const backgroundColor = colors.red[300];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon title="Legendary" color={color} backgroundColor={backgroundColor} {...props} src={src}>
            L
        </PlanetIcon>
    );
}

export function HomePlanet(props: PlanetIconProps) {
    const theme = useTheme();
    const color = colors.yellow[500];
    const backgroundColor = theme.palette.getContrastText(color);
    return (
        <PlanetIcon title="Home" color={color} backgroundColor={backgroundColor} {...props}>
            <LanguageIcon />
        </PlanetIcon>
    );
}

export function Cultural(props: PlanetIconProps) {
    const src = useIcon('cultural');
    const theme = useTheme();
    const backgroundColor = colors.cyan[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon title="Cultural" color={color} backgroundColor={backgroundColor} {...props} src={src}>
            U
        </PlanetIcon>
    );
}

export function Hazardous(props: PlanetIconProps) {
    const src = useIcon('hazardous');
    const theme = useTheme();
    const backgroundColor = colors.red.A700;
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon title="Hazardous" color={color} backgroundColor={backgroundColor} {...props} src={src}>
            H
        </PlanetIcon>
    );
}

export function Industrial(props: PlanetIconProps) {
    const src = useIcon('industrial');
    const theme = useTheme();
    const backgroundColor = colors.teal[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon title="Industrial" color={color} backgroundColor={backgroundColor} {...props} src={src}>
            D
        </PlanetIcon>
    );
}
