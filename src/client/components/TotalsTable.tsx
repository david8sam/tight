import React from 'react';

import { Table, TableBody, TableCell, TableCellProps, TableHead, TableRow } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { Biotic, Cybernetic, Influence, Propulsion, Resources, Warfare } from './PlanetIcons';

export interface TotalsTableProps {
    resources: number;
    influence: number;
    biotic: number; // green
    warfare: number; //red
    propulsion: number; // blue
    cybernetic: number; // yellow
}

const useStyle = makeStyles()(() => ({
    tableRow: {
        userSelect: 'none',
    },
    icon: {
        margin: 'auto',
    },
}));

function TotalsTable(props: TotalsTableProps) {
    const { classes } = useStyle();
    const { resources = 0, influence = 0, biotic = 0, warfare = 0, propulsion = 0, cybernetic = 0 } = props;

    const cellProps: TableCellProps = { align: 'center' };
    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>
                        <Resources classes={{ root: classes.icon }} />
                    </TableCell>
                    <TableCell>
                        <Influence classes={{ root: classes.icon }} />
                    </TableCell>
                    <TableCell>
                        <Biotic classes={{ root: classes.icon }} />
                    </TableCell>
                    <TableCell>
                        <Warfare classes={{ root: classes.icon }} />
                    </TableCell>
                    <TableCell>
                        <Propulsion classes={{ root: classes.icon }} />
                    </TableCell>
                    <TableCell>
                        <Cybernetic classes={{ root: classes.icon }} />
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                <TableRow classes={{ root: classes.tableRow }}>
                    <TableCell {...cellProps}>{resources}</TableCell>
                    <TableCell {...cellProps}>{influence}</TableCell>
                    <TableCell {...cellProps}>{biotic}</TableCell>
                    <TableCell {...cellProps}>{warfare}</TableCell>
                    <TableCell {...cellProps}>{propulsion}</TableCell>
                    <TableCell {...cellProps}>{cybernetic}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}

export default TotalsTable;
