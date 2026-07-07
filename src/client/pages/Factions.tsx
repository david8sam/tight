import React, { useEffect, useState } from 'react';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Button, CircularProgress, Grid, IconButton, Tooltip } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { Faction } from 'common/Faction';

import FactionInfo, { FactionAccordionIndex, FactionInfoProps } from '../components/FactionInfo';
import FactionSelect from '../components/FactionSelect';
import api from '../utils/api';

// Num accordions
const COUNT = Object.keys(FactionAccordionIndex).length;

const useStyles = makeStyles()(theme => ({
    header: {
        position: 'sticky',
        top: 0,
        zIndex: theme.zIndex.appBar,
        backgroundColor: theme.palette.background.default,
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: theme.spacing(1, 1.5),
    },
    nav: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        marginBottom: theme.spacing(1),
    },
    expandControls: {
        display: 'flex',
        gap: theme.spacing(1),
    },
}));

function Factions() {
    const { classes } = useStyles();

    const [factionInfo, setFactionInfo] = useState<Faction | null>(null);
    const [factionNames, setFactionNames] = useState<string[]>([]);
    const [selectedName, setSelectedName] = useState<string>('');
    const [pending, setPending] = useState(false);

    const [expanded, setExpanded] = useState<boolean[]>(Array(COUNT).fill(false));

    const onExpandedChange: FactionInfoProps['onExpandedChange'] = (index, e, expand) => {
        const newExpanded = [...expanded];
        newExpanded[index] = expand;
        setExpanded(newExpanded);
    };

    useEffect(() => {
        setPending(true);

        const setup = async () => {
            const names = await api.factionListNames();
            const [firstFaction] = await api.factionGetFaction({ name: names[0] });
            setFactionNames(names);
            setSelectedName(names[0]);
            setFactionInfo(firstFaction);
            setPending(false);
        };

        setup();
    }, []);

    // Don't render until we have enough data.
    if (factionNames.length === 0 || !selectedName) {
        return null;
    }

    const onFactionChange = (factionName: string) => {
        setPending(true);
        setSelectedName(factionName);
        api.factionGetFaction({ name: factionName }).then(factions => {
            setFactionInfo(factions[0] ?? null);
            setPending(false);
        });
    };

    const index = factionNames.indexOf(selectedName);
    const lastIndex = factionNames.length - 1;
    const prevFaction = index === 0 ? factionNames[lastIndex] : factionNames[index - 1];
    const nextFaction = index === lastIndex ? factionNames[0] : factionNames[index + 1];

    return (
        <>
            <div className={classes.header}>
                <div className={classes.nav}>
                    <Tooltip title={prevFaction}>
                        <IconButton onClick={() => onFactionChange(prevFaction)}>
                            <NavigateBeforeIcon />
                        </IconButton>
                    </Tooltip>
                    <FactionSelect
                        fullWidth
                        factionNames={factionNames}
                        value={selectedName}
                        onChange={onFactionChange}
                        hideNone
                    />
                    <Tooltip title={nextFaction}>
                        <IconButton onClick={() => onFactionChange(nextFaction)}>
                            <NavigateNextIcon />
                        </IconButton>
                    </Tooltip>
                </div>
                <div className={classes.expandControls}>
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={expanded.every(e => !e)}
                        onClick={() => setExpanded(Array(COUNT).fill(false))}
                    >
                        Collapse
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={expanded.every(e => e)}
                        onClick={() => setExpanded(Array(COUNT).fill(true))}
                    >
                        Expand
                    </Button>
                </div>
            </div>
            {pending ? (
                <Grid sx={{ height: '100%' }} container justifyContent="center" alignItems="center" direction="column">
                    <CircularProgress size={'50vw'} />
                </Grid>
            ) : (
                <FactionInfo faction={factionInfo} expanded={expanded} onExpandedChange={onExpandedChange} />
            )}
        </>
    );
}

export default Factions;
