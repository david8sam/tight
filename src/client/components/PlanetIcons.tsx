import React, { useState } from 'react';
import { colors, Avatar, Theme, AvatarProps } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/styles';
import LanguageIcon from '@material-ui/icons/Language';

const useStyle = makeStyles((theme: Theme) => ({
    root: ({ color, backgroundColor }: { color?: string; backgroundColor?: string }) => ({
        height: 24,
        width: 24,
        color,
        backgroundColor,
    }),
}));

function useIcon(name: string) {
    const [icon, setIcon] = useState('');
    import(`../assets/ti4/${name}.png`).then(i => setIcon(i.default)).catch(e => setIcon(''));

    return icon;
}

interface PlanetIconProps extends AvatarProps {
    classes?: object;
    color?: string;
    backgroundColor?: string;
}

function PlanetIcon(props: PlanetIconProps) {
    const classes = useStyle(props);
    const { children, color, backgroundColor, ...otherProps } = props;
    return (
        <Avatar className={classes.root} variant="square" {...otherProps}>
            {children}
        </Avatar>
    );
}

export function Resources(props: PlanetIconProps) {
    const theme: Theme = useTheme();
    const backgroundColor = colors.deepOrange[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon color={color} backgroundColor={backgroundColor} {...props}>
            R
        </PlanetIcon>
    );
}

export function Influence(props: PlanetIconProps) {
    const theme: Theme = useTheme();
    const backgroundColor = colors.deepPurple[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon color={color} backgroundColor={backgroundColor} {...props}>
            I
        </PlanetIcon>
    );
}

export function Biotic(props: PlanetIconProps) {
    const src = useIcon('biotic');
    const theme: Theme = useTheme();
    const backgroundColor = colors.green[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon color={color} backgroundColor={backgroundColor} {...props} src={src}>
            B
        </PlanetIcon>
    );
}

export function Warfare(props: PlanetIconProps) {
    const src = useIcon('warfare');
    const theme: Theme = useTheme();
    const backgroundColor = colors.red[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon color={color} backgroundColor={backgroundColor} {...props} src={src}>
            W
        </PlanetIcon>
    );
}

export function Propulsion(props: PlanetIconProps) {
    const src = useIcon('propulsion');
    const theme: Theme = useTheme();
    const backgroundColor = colors.blue[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon color={color} backgroundColor={backgroundColor} {...props} src={src}>
            P
        </PlanetIcon>
    );
}

export function Cybernetic(props: PlanetIconProps) {
    const src = useIcon('cybernetic');
    const theme: Theme = useTheme();
    const backgroundColor = colors.yellow[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon color={color} backgroundColor={backgroundColor} {...props} src={src}>
            C
        </PlanetIcon>
    );
}

export function Legendary(props: PlanetIconProps) {
    const src = useIcon('legendary');
    const theme: Theme = useTheme();
    const backgroundColor = colors.red[300];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon color={color} backgroundColor={backgroundColor} {...props} src={src}>
            L
        </PlanetIcon>
    );
}

export function HomePlanet() {
    const theme: Theme = useTheme();
    const color = colors.yellow[500];
    const backgroundColor = theme.palette.getContrastText(color);
    const classes = useStyle({ color, backgroundColor });
    return <LanguageIcon classes={{ root: classes.root }} />;
}

export function Cultural(props: PlanetIconProps) {
    const src = useIcon('cultural');
    const theme: Theme = useTheme();
    const backgroundColor = colors.cyan[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon color={color} backgroundColor={backgroundColor} {...props} src={src}>
            U
        </PlanetIcon>
    );
}

export function Hazardous(props: PlanetIconProps) {
    const src = useIcon('hazardous');
    const theme: Theme = useTheme();
    const backgroundColor = colors.red.A700;
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon color={color} backgroundColor={backgroundColor} {...props} src={src}>
            H
        </PlanetIcon>
    );
}

export function Industrial(props: PlanetIconProps) {
    const src = useIcon('industrial');
    const theme: Theme = useTheme();
    const backgroundColor = colors.teal[500];
    const color = theme.palette.getContrastText(backgroundColor);
    return (
        <PlanetIcon color={color} backgroundColor={backgroundColor} {...props} src={src}>
            D
        </PlanetIcon>
    );
}
