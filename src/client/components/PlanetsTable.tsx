import React, { ReactNode, useState } from 'react';

import { Edit } from '@mui/icons-material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import {
    Checkbox,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableCellProps,
    TableHead,
    TableRow,
    TableSortLabel,
    TableSortLabelProps,
    TextField,
    Tooltip,
    Typography,
    styled,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import { PlanetMap } from 'common/Planet';

import useGameInfo from '../hooks/useGameInfo';
import { getPlanetValue } from '../utils/planet';

import { PlanetData } from '../types';

import EditPlanetDialog from './EditPlanetDialog';
import { Influence, Resources } from './PlanetIcons';
import PlanetNameCell, { PlanetNameCellProps } from './PlanetNameCell';

export type ColumnType = keyof Omit<PlanetData, 'modifiers'>;

const StyledDiv = styled('div')({});

const FILTER_BY_NAME_HEIGHT = '90px';

const useStyle = makeStyles(theme => ({
    title: {
        flex: '1 1 100%',
    },
    toolbar: {
        margin: `${theme.spacing(2)} 0px`,
    },
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
        } else if (column === 'resources' || column === 'influence') {
            const modifier = planet.modifiers?.[column];
            if (typeof value === 'number' && modifier !== undefined && modifier !== 0) {
                const baseValue = value;
                value = (
                    <StyledDiv sx={{ display: 'flex' }}>
                        <Typography color="green">{baseValue + modifier}</Typography>
                        <Typography sx={{ paddingLeft: 1, textWrap: 'nowrap' }}>{baseValue}</Typography>
                    </StyledDiv>
                );
            }
        }

        return (
            <TableCell key={column} align="left">
                {value}
            </TableCell>
        );
    });
}

export interface PlanetsTableProps {
    classes?: object;
    factionName?: string | null; // name to filter the list of planets if any
    ownerFactionName?: string; // name for filtering "My Planets" button
    columns?: ColumnType[];

    filterByPlanetOnly?: boolean;

    showCheckbox?: boolean;
    selection?: string[];
    onSelectionChange?: (selection: string[]) => void;
    onPlanetClick?: (id: string) => void | null;

    PlanetNameCellProps?: Omit<PlanetNameCellProps, 'planet'>;
    planetMap: PlanetMap;
}

function PlanetsTable(props: PlanetsTableProps) {
    const classes = useStyle(props);
    const { game } = useGameInfo();

    const {
        planetMap,
        factionName,
        ownerFactionName,
        columns = DEFAULT_COLUMNS,
        filterByPlanetOnly,
        showCheckbox = false,
        selection = [],
        onSelectionChange = () => {},
        onPlanetClick = () => {},
        PlanetNameCellProps,
    } = props;

    const [nameFilter, setNameFilter] = useState('');
    const [sortBy, setSortBy] = useState<{ key: ColumnType; asc: boolean }>({ key: 'name', asc: true });
    const [editPlanet, setEditPlanet] = useState<PlanetData | null>(null);

    const { planets = {} } = game || {};
    let names = Object.keys(planets);
    if (factionName) {
        names = names.filter(n => planets[n] && planets[n].owner === factionName);
    }

    // Apply owner filter
    if (nameFilter) {
        const filterLower = nameFilter.toLowerCase();
        const p = planets || {};
        names = names.filter(n => {
            if (n.toLowerCase().includes(filterLower)) {
                return true;
            }

            if (filterByPlanetOnly) {
                return false;
            }

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
            const planetA = { ...planetMap[a], ...planets[a] } as PlanetData;
            const planetB = { ...planetMap[b], ...planets[b] } as PlanetData;

            // Swap values depending on sort direction
            let value1 = asc ? getPlanetValue(planetA, key) : getPlanetValue(planetB, key);
            let value2 = asc ? getPlanetValue(planetB, key) : getPlanetValue(planetA, key);

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

    const isFiltered = Boolean(nameFilter);
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
            <TableCell sx={{ top: FILTER_BY_NAME_HEIGHT }} padding="checkbox">
                <Checkbox
                    indeterminate={filteredSelection.length > 0 && filteredSelection.length < names.length}
                    checked={filteredSelection.length > 0 && filteredSelection.length === names.length}
                    onChange={onSelectAll}
                />
            </TableCell>
        );
    }

    // Add filter by plant or owner names
    const filterByName = (
        <TextField
            variant="outlined"
            fullWidth
            value={nameFilter}
            label={`Filter By Name${filterByPlanetOnly ? '' : ' or Owner'}`}
            onChange={e => setNameFilter(e.target.value)}
            InputProps={{
                endAdornment: (
                    <>
                        {!filterByPlanetOnly && (
                            <Tooltip title="My Planets">
                                <IconButton onClick={() => setNameFilter(ownerFactionName || '')} size="large">
                                    <AccountCircleIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="clear">
                            <IconButton onClick={() => setNameFilter('')} size="large">
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    </>
                ),
            }}
        />
    );

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
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ margin: 1, height: FILTER_BY_NAME_HEIGHT }} colSpan={4}>
                            {filterByName}
                        </TableCell>
                    </TableRow>
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
                                <TableCell
                                    sx={{ top: FILTER_BY_NAME_HEIGHT }}
                                    key={column}
                                    onClick={() => onSortBy(column)}
                                    {...extraProps}
                                >
                                    <TableSortLabel {...sortLabelProps}>{label}</TableSortLabel>
                                </TableCell>
                            );
                        })}
                        <TableCell sx={{ top: FILTER_BY_NAME_HEIGHT }} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {names.map(name => {
                        const planet: PlanetData = { ...planetMap[name], ...planets[name] };
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
                                <TableCell align="center">
                                    <Tooltip title="Edit">
                                        <IconButton
                                            onClick={e => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setEditPlanet(planet);
                                            }}
                                        >
                                            <Edit />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
            {editPlanet ? <EditPlanetDialog open onClose={() => setEditPlanet(null)} planet={editPlanet} /> : null}
        </>
    );
}

export default PlanetsTable;
