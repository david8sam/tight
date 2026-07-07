import React from 'react';

import FactionsSetup from '../components/FactionsSetup';
import { PageContainer } from '../components/ui';
import useGameInfo from '../hooks/useGameInfo';

/**
 * Player info and edit page
 */
function Players() {
    const { game } = useGameInfo();

    if (!game) {
        return null;
    }

    return (
        <PageContainer>
            <FactionsSetup disableFactionSelect disableColorNone />
        </PageContainer>
    );
}

export default Players;
