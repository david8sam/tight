import React, { MouseEvent, useState } from 'react';

import { IconButton, Popover, Tooltip, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import {
    Resources,
    Influence,
    Biotic,
    Warfare,
    Propulsion,
    Cybernetic,
    HomePlanet,
    Cultural,
    Hazardous,
    Industrial,
    Legendary,
    DMZPlanet,
} from './PlanetIcons';

const ICONS: { Component: React.ElementType; label: string }[] = [
    {
        Component: Resources,
        label: 'Resources',
    },
    {
        Component: Influence,
        label: 'Influence',
    },
    {
        Component: Biotic,
        label: 'Biotic Tech Bonus',
    },
    {
        Component: Warfare,
        label: 'Warfare Tech Bonus',
    },
    {
        Component: Propulsion,
        label: 'Propulsion Tech Bonus',
    },
    {
        Component: Cybernetic,
        label: 'Cybernetic Tech Bonus',
    },
    {
        Component: HomePlanet,
        label: 'Home Planet',
    },
    {
        Component: Cultural,
        label: 'Cultural Planet Trait',
    },
    {
        Component: Hazardous,
        label: 'Hazardous Planet Trait',
    },
    {
        Component: Industrial,
        label: 'Industrial Planet Trait',
    },
    {
        Component: Legendary,
        label: 'Legendary Planet',
    },
    {
        Component: DMZPlanet,
        label: 'DMZ Planet',
    },
];

function PlanetIconInfoButton() {
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLButtonElement | null>(null);

    const onButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
        setPopoverAnchor(e.currentTarget);
    };

    const onClosePopover = () => {
        setPopoverAnchor(null);
    };

    const open = Boolean(popoverAnchor);

    return (
        <>
            <Tooltip title="Planet Icon Info">
                <IconButton onClick={onButtonClick} size="large">
                    <InfoIcon />
                </IconButton>
            </Tooltip>
            <Popover
                open={open}
                anchorEl={popoverAnchor}
                onClose={onClosePopover}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <List>
                    {ICONS.map(({ Component, label }) => (
                        <ListItem key={label}>
                            <ListItemAvatar>
                                <Component hideTitle />
                            </ListItemAvatar>
                            <ListItemText>{label}</ListItemText>
                        </ListItem>
                    ))}
                </List>
            </Popover>
        </>
    );
}

export default PlanetIconInfoButton;
