import React, { useEffect, useState } from 'react';

import { MenuItem, Select, SelectProps, useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { MessageType } from 'common/message';

import { useAppContext } from '../Context';
import useGameInfo from '../hooks/useGameInfo';
import api from '../utils/api';
import { getFactionColors } from '../utils/faction';

import ColorSelect, { COLOR_NONE } from './ColorSelect';
import FactionSelect from './FactionSelect';
import PlayerSelect from './PlayerSelect';
import { Panel, SectionHeader } from './ui';

interface FactionsSetupProps {
    disableFactionSelect?: boolean;
    disableColorNone?: boolean;
    disableReordering?: boolean;
}

const useStyles = makeStyles()(theme => ({
    root: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: theme.spacing(1.5),
        padding: theme.spacing(1.5),
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.5),
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing(1),
    },
    orderSelect: {
        minWidth: 64,
        '& .MuiSelect-select': {
            padding: theme.spacing(0.5, 1),
        },
    },
}));

function FactionsSetup(props: FactionsSetupProps) {
    const { classes } = useStyles();
    const theme = useTheme();
    const { sendData } = useAppContext();
    const { game, gameId } = useGameInfo();
    const { factions, players } = game || {};
    const { disableFactionSelect, disableColorNone, disableReordering } = props;

    const [factionNames, setFactionNames] = useState<string[]>([]);
    useEffect(() => {
        api.factionListNames().then(names => setFactionNames(names));
    }, []);

    if (!game || !factions || factionNames.length === 0) {
        return null;
    }

    const onFactionChange = (i: number, factionName: string) => {
        sendData({ type: MessageType.GAME_UPDATE_FACTION, data: { gameId, order: i, name: factionName } });
    };

    const onColorChange = (i: number, color: string) => {
        sendData({ type: MessageType.GAME_UPDATE_FACTION, data: { gameId, order: i, color } });
    };

    const onPlayerChange = (i: number, playerIds: string[]) => {
        sendData({ type: MessageType.GAME_UPDATE_FACTION, data: { gameId, order: i, playerIds } });
    };

    const onFactionReorder: NonNullable<SelectProps<number>['onChange']> = e => {
        const index = Number(e.target.name);
        const newIndex = e.target.value;
        if (index !== newIndex) {
            sendData({ type: MessageType.GAME_REORDER_FACTION, data: { gameId, index, newIndex } });
        }
    };

    const playerOrderOptions = Array.from({ length: factions.length }).map((_, i) => ({
        value: i,
        label: `${i + 1}`,
    }));

    return (
        <div className={classes.root}>
            {factions.map((faction, i) => {
                const { name, color, playerIds } = faction;
                const accent = color && color !== COLOR_NONE ? getFactionColors(theme, faction).readable : undefined;

                return (
                    <Panel key={i} className={classes.card} accent={accent}>
                        <div className={classes.header}>
                            <SectionHeader>Seat {i + 1}</SectionHeader>
                            <Select
                                className={classes.orderSelect}
                                name={`${i}`}
                                value={i}
                                onChange={onFactionReorder}
                                disabled={disableReordering}
                                size="small"
                            >
                                {playerOrderOptions.map(o => (
                                    <MenuItem key={o.value} value={o.value}>
                                        {o.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </div>
                        <FactionSelect
                            disabled={disableFactionSelect}
                            order={i}
                            factionNames={factionNames}
                            value={name}
                            onChange={name => onFactionChange(i, name)}
                        />
                        <ColorSelect
                            order={i}
                            value={color}
                            onChange={color => onColorChange(i, color)}
                            disableNone={disableColorNone}
                        />
                        <PlayerSelect
                            playerNames={players || []}
                            value={playerIds}
                            onChange={player => onPlayerChange(i, player)}
                        />
                    </Panel>
                );
            })}
        </div>
    );
}

export default FactionsSetup;
