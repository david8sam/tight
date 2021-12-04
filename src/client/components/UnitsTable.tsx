import React from 'react';

import { Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';

import { UnitCountMap } from 'common/Faction';

export interface UnitsCountTableProps {
    unitsCountMap: UnitCountMap;
}

export default function UnitsCountTable(props: UnitsCountTableProps) {
    const { unitsCountMap } = props;

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Unit</TableCell>
                    <TableCell>Count</TableCell>
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
