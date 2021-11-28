import React from 'react';
import { Faction } from 'common/Faction';

export interface FactionInfoProps {
    faction: Faction | null;
}

function FactionInfo(props: FactionInfoProps) {
    // TODO: Design and implement layout
    const { faction } = props;
    const { name } = faction || {};

    return <div>{name}</div>;
}

export default FactionInfo;
