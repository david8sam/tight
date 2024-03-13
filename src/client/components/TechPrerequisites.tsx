import React from 'react';
import { Grid, Typography } from '@mui/material';
import { TechPrereq } from 'common/Faction';
import { Biotic, Cybernetic, Propulsion, Warfare } from './PlanetIcons';

export interface TechPrerequisitesProps {
    prereq?: TechPrereq;
}

export default function TechPrerequisites(props: TechPrerequisitesProps) {
    const { prereq } = props;
    if (!prereq) {
        return null;
    }

    const { biotic, cybernetic, propulsion, warfare } = prereq;

    const buildIcons = (Component: typeof Biotic, count?: number) => {
        if (!count) {
            return null;
        }

        return Array(count)
            .fill(0)
            .map((_, i) => (
                <Grid key={i} item>
                    <Component />
                </Grid>
            ));
    };

    return (
        <Grid container direction="row" spacing={1}>
            <Grid item>
                <Typography>Prerequisites:</Typography>
            </Grid>
            {buildIcons(Biotic, biotic)}
            {buildIcons(Cybernetic, cybernetic)}
            {buildIcons(Propulsion, propulsion)}
            {buildIcons(Warfare, warfare)}
        </Grid>
    );
}
