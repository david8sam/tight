import React, { ChangeEvent } from 'react';

import { FormControlLabel, Grid, Switch, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { MessageType } from 'common/message';
import { Traits } from 'common/Planet';

import useGameInfo from '../hooks/useGameInfo';
import { getPlanetValue } from '../utils/planet';

import { useAppContext } from '../Context';
import { PlanetData } from '../types';
import {
    Biotic,
    Cultural,
    Cybernetic,
    Hazardous,
    HomePlanet,
    Industrial,
    Legendary,
    Propulsion,
    Warfare,
} from './PlanetIcons';

const useStyle = makeStyles(theme => ({
    icon: {
        marginRight: theme.spacing(1),
    },
    grid: {
        width: 'auto',
    },
}));

export interface PlanetNameCellProps {
    planet: PlanetData;
    owner?: string;
    hideAbility?: boolean;
}

export default function PlanetNameCell(props: PlanetNameCellProps) {
    const classes = useStyle(props);
    const { sendData } = useAppContext();
    const { gameId } = useGameInfo();
    const { planet, owner, hideAbility } = props;
    const { name, home, legendary } = planet;

    const trait = getPlanetValue(planet, 'trait');
    const biotic = getPlanetValue(planet, 'biotic') ?? 0;
    const warfare = getPlanetValue(planet, 'warfare') ?? 0;
    const propulsion = getPlanetValue(planet, 'propulsion') ?? 0;
    const cybernetic = getPlanetValue(planet, 'cybernetic') ?? 0;

    // Add icons below the name
    const icons = [];
    const iconProps = { classes: { root: classes.icon } };
    if (home) {
        icons.push(<HomePlanet key="home" {...iconProps} />);
    }

    for (let b = 0; b < biotic; b++) {
        icons.push(<Biotic key={`biotic${b}`} {...iconProps} />);
    }

    for (let w = 0; w < warfare; w++) {
        icons.push(<Warfare key={`warfare${w}`} {...iconProps} />);
    }

    for (let p = 0; p < propulsion; p++) {
        icons.push(<Propulsion key={`propulsion${p}`} {...iconProps} />);
    }

    for (let c = 0; c < cybernetic; c++) {
        icons.push(<Cybernetic key={`cybernetic${c}`} {...iconProps} />);
    }

    switch (trait) {
        case Traits.CULTURAL:
            icons.push(<Cultural key="cultural" {...iconProps} />);
            break;
        case Traits.HAZARDOUS:
            icons.push(<Hazardous key="hazardous" {...iconProps} />);
            break;
        case Traits.INDUSTRIAL:
            icons.push(<Industrial key="industrial" {...iconProps} />);
            break;
        default:
            break;
    }

    if (legendary) {
        icons.push(<Legendary key="legendary" {...iconProps} title={planet.legendary} />);
    }

    const onExhaustChange = (e: ChangeEvent<HTMLDivElement>, exhaust: boolean) => {
        e.stopPropagation();
        sendData({
            type: exhaust ? MessageType.EXHAUST_PLANET_ABILITY : MessageType.REFRESH_PLANET_ABILITY,
            data: { gameId, factionName: owner, planetId: planet.name },
        });
    };

    const isLegendary = Boolean(planet.legendary);
    const abilityExhausted = !planet.refreshedAbility;

    return (
        <Grid container direction="row" spacing={2}>
            <Grid item>
                <Grid container direction="column" className={classes.grid}>
                    <Grid item>{name}</Grid>
                    <Grid container>{icons}</Grid>
                </Grid>
            </Grid>
            {isLegendary && !hideAbility && (
                <Grid item>
                    <Grid container justifyContent="center" alignItems="center" className={classes.grid}>
                        <FormControlLabel
                            control={<Switch color="primary" checked={abilityExhausted} onChange={onExhaustChange} />}
                            label={
                                <Grid container direction="column" justifyContent="center" alignItems="center">
                                    <Typography variant="subtitle2">Exhaust</Typography>
                                    <Typography variant="subtitle2">Ability</Typography>
                                </Grid>
                            }
                            onClick={e => e.stopPropagation()}
                        />
                    </Grid>
                </Grid>
            )}
        </Grid>
    );
}
