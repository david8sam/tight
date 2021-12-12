import React, { useState, ReactNode } from 'react';
import {
    Checkbox,
    IconButton,
    makeStyles,
    Table,
    TableBody,
    TableCell,
    TableCellProps,
    TableHead,
    TableRow,
    TableSortLabel,
    Toolbar,
    Tooltip,
    TextField,
    Theme,
    TableSortLabelProps,
} from '@material-ui/core';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import CloseIcon from '@material-ui/icons/Close';

import { useAppContext } from '../Context';
import { PlanetData } from '../types';
import { Resources, Influence } from './PlanetIcons';
import PlanetNameCell, { PlanetNameCellProps } from './PlanetNameCell';

export type ColumnType = keyof PlanetData;

export interface PlanetsTableProps {
    classes?: object;
    gameId?: string | null;
    playerId?: string | null;
    columns?: ColumnType[];

    showFilterByName?: boolean;
    showFilterByOwner?: boolean;

    showCheckbox?: boolean;
    selection?: string[];
    onSelectionChange?: (selection: string[]) => void;
    onPlanetClick?: (id: string) => void | null;

    PlanetNameCellProps?: Omit<PlanetNameCellProps, 'planet'>;
}

const useStyle = makeStyles(theme => ({
    title: {
        flex: '1 1 100%',
    },
    toolbar: {
        margin: `${theme.spacing(2)}px 0px`,
    },
    tableBody: {},
    tableHeaderSmall: {
        maxWidth: 80,
    },
    tableRow: {
        height: 80,
        '&:hover': {
            cursor: 'pointer',
            userSelect: 'none',
        },
    },
}));

const DEFAULT_COLUMNS: ColumnType[] = ['name', 'owner', 'resources', 'influence'];

function renderCells(
    planet: PlanetData,
    columns: ColumnType[],
    PlanetNameCellProps: PlanetsTableProps['PlanetNameCellProps'],
) {
    return columns.map(column => {
        let value: ReactNode = planet[column];
        if (column === 'name') {
            value = <PlanetNameCell {...PlanetNameCellProps} planet={planet} />;
        } else if (column === 'owner') {
            value = value || '-';
        }

        return (
            <TableCell key={column} align="left">
                {value}
            </TableCell>
        );
    });
}

function PlanetsTable(props: PlanetsTableProps) {
    const classes = useStyle(props);
    const {
        state: { games, planets: planetDB = {}, account },
    } = useAppContext();

    const loggedInPlayer = account?.id;

    const {
        gameId,
        playerId,
        columns = DEFAULT_COLUMNS,
        showFilterByName,
        showFilterByOwner,
        showCheckbox = false,
        selection = [],
        onSelectionChange = () => {},
        onPlanetClick = () => {},
        PlanetNameCellProps,
    } = props;

    const [nameFilter, setNameFilter] = useState('');
    const [ownerFilter, setOwnerFilter] = useState('');
    const [sortBy, setSortBy] = useState<{ key: ColumnType; asc: boolean }>({ key: 'name', asc: true });

    const { planets = {} } = gameId && games ? games[gameId] : {};
    let names = Object.keys(planets);
    if (playerId) {
        names = names.filter(n => planets[n] && planets[n].owner === playerId);
    }

    // Apply name filter
    if (nameFilter) {
        const filterLower = nameFilter.toLowerCase();
        names = names.filter(n => n.toLowerCase().includes(filterLower));
    }

    // Apply owner filter
    if (ownerFilter) {
        const filterLower = ownerFilter.toLowerCase();
        const p = planets || {};
        names = names.filter(n => {
            const owner = p[n] && p[n].owner;
            if (!owner) {
                return false;
            }

            return owner.toLowerCase().includes(filterLower);
        });
    }

    // Apply sorting
    if (sortBy) {
        const { key, asc } = sortBy;
        names.sort((a, b) => {
            const planetA = { ...planetDB[a], ...planets[a] } as PlanetData;
            const planetB = { ...planetDB[b], ...planets[b] } as PlanetData;

            // Swap values depending on sort direction
            let value1 = asc ? planetA[key] : planetB[key];
            let value2 = asc ? planetB[key] : planetA[key];

            // Default the value based on type in cases of null/undefined.
            // Case insensitive for string comparison.
            const defaultValue = typeof value1 === 'string' || typeof value2 === 'string' ? '' : 0;
            value1 = (typeof value1 === 'string' ? value1.toLowerCase() : value1) || defaultValue;
            value2 = (typeof value2 === 'string' ? value2.toLowerCase() : value2) || defaultValue;

            if (value1 < value2) {
                return -1;
            } else if (value1 > value2) {
                return 1;
            }

            return 0;
        });
    }

    const isFiltered = nameFilter || ownerFilter;
    const filteredSelection = isFiltered ? selection.filter(s => names.includes(s)) : selection;

    // Handle row click events
    const onRowClick = (name: string) => {
        if (showCheckbox) {
            const index = selection.findIndex(s => s === name);
            if (index < 0) {
                // Add to selection
                onSelectionChange([...selection, name].sort());
            } else {
                // Remove from selection
                onSelectionChange(selection.filter(s => s !== name));
            }
        }

        onPlanetClick(name);
    };

    // Handle select/deselect all
    const onSelectAll = () => {
        const newSelection = filteredSelection.length === names.length ? [] : names;

        let finalSelection = newSelection;
        if (isFiltered) {
            // If filtered, combine with selection
            if (newSelection.length === 0) {
                // Remove all from current selection
                finalSelection = selection.filter(s => !filteredSelection.includes(s));
            } else {
                // Merge into current selection
                finalSelection = selection.concat(newSelection.filter(n => !selection.includes(n)));
            }
        }

        onSelectionChange(finalSelection);
    };

    // Add checkboxes
    let headerCheckbox = null;
    if (showCheckbox) {
        headerCheckbox = (
            <TableCell padding="checkbox">
                <Checkbox
                    indeterminate={filteredSelection.length > 0 && filteredSelection.length < names.length}
                    checked={filteredSelection.length > 0 && filteredSelection.length === names.length}
                    onChange={onSelectAll}
                />
            </TableCell>
        );
    }

    // Add filter by planet names
    let filterByName = null;
    if (showFilterByName) {
        filterByName = (
            <Toolbar classes={{ root: classes.toolbar }}>
                <TextField
                    variant="outlined"
                    fullWidth
                    value={nameFilter}
                    label="Filter By Name"
                    onChange={e => setNameFilter(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <Tooltip title="clear">
                                <IconButton onClick={() => setNameFilter('')}>
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        ),
                    }}
                />
            </Toolbar>
        );
    }

    // Add filter by owner names
    let filterByOwner = null;
    if (showFilterByOwner) {
        filterByOwner = (
            <Toolbar classes={{ root: classes.toolbar }}>
                <TextField
                    variant="outlined"
                    fullWidth
                    value={ownerFilter}
                    label="Filter By Owner"
                    onChange={e => setOwnerFilter(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <>
                                <Tooltip title="My Planets">
                                    <IconButton onClick={() => setOwnerFilter(loggedInPlayer || '')}>
                                        <AccountCircleIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="clear">
                                    <IconButton onClick={() => setOwnerFilter('')}>
                                        <CloseIcon />
                                    </IconButton>
                                </Tooltip>
                            </>
                        ),
                    }}
                />
            </Toolbar>
        );
    }

    // Handle sort when clicking on a table column header
    const onSortBy = (headerKey: ColumnType) => {
        const { key, asc } = sortBy;
        if (key !== headerKey) {
            setSortBy({ key: headerKey, asc: true });
        } else {
            setSortBy({ key: headerKey, asc: !asc });
        }
    };

    const { key: sortKey = null, asc } = sortBy || {};

    return (
        <>
            {filterByName}
            {filterByOwner}
            <Table>
                <TableHead>
                    <TableRow>
                        {headerCheckbox}
                        {columns.map(column => {
                            let label = null;
                            let extraProps: TableCellProps = {};
                            if (column === 'resources') {
                                label = <Resources hideTitle />;
                                extraProps.classes = { root: classes.tableHeaderSmall };
                            } else if (column === 'influence') {
                                label = <Influence hideTitle />;
                                extraProps.classes = { root: classes.tableHeaderSmall };
                            } else {
                                label = column.toUpperCase();
                            }

                            const sortLabelProps: TableSortLabelProps = {};
                            if (column === sortKey) {
                                sortLabelProps.active = true;
                                sortLabelProps.direction = asc ? 'asc' : 'desc';
                            }

                            return (
                                <TableCell key={column} onClick={() => onSortBy(column)} {...extraProps}>
                                    <TableSortLabel {...sortLabelProps}>{label}</TableSortLabel>
                                </TableCell>
                            );
                        })}
                    </TableRow>
                </TableHead>
                <TableBody classes={{ root: classes.tableBody }}>
                    {names.map(name => {
                        const planet: PlanetData = { ...planetDB[name], ...planets[name] };
                        let rowCheckbox = null;
                        if (showCheckbox) {
                            rowCheckbox = (
                                <TableCell padding="checkbox">
                                    <Checkbox checked={selection.includes(name)} />
                                </TableCell>
                            );
                        }

                        const selected = selection.includes(name);
                        return (
                            <TableRow
                                selected={selected}
                                classes={{ root: classes.tableRow }}
                                key={name}
                                onClick={e => onRowClick(name)}
                            >
                                {rowCheckbox}
                                {renderCells(planet, columns, PlanetNameCellProps)}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
}

export default PlanetsTable;
