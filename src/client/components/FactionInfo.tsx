import React from 'react';
import { Faction } from 'common/Faction';

export interface FactionInfoProps {
    data: Faction | null;
}

function FactionInfo(props: FactionInfoProps) {
    // TODO: Design and implement layout

    return props.data ? <div>{props.data.name}</div> : null;
}

export default FactionInfo;
