import React from 'react';

import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';

import { UnitCountMap } from 'common/Faction';

const useStyle = makeStyles(() => ({
    headerCell: {
        fontWeight: 'bold',
    },
}));

export interface UnitsCountTableProps {
    unitsCountMap: UnitCountMap;
}

export default function UnitsCountTable(props: UnitsCountTableProps) {
    const classes = useStyle();
    const { unitsCountMap } = props;

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>
                        <Typography className={classes.headerCell}>Unit</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography className={classes.headerCell}>Count</Typography>
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {Object.entries(unitsCountMap).map(([name, count]) => (
                    <TableRow key={name}>
                        <TableCell>{name}</TableCell>
                        <TableCell>{count}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
