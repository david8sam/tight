import { ElementType } from 'react';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupsIcon from '@mui/icons-material/Groups';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PublicIcon from '@mui/icons-material/Public';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import StyleIcon from '@mui/icons-material/Style';

export interface NavItem {
    /** Route segment; '' is home */
    id: string;
    label: string;
    Icon: ElementType;
    /** Route lives under /:gameId and needs a loaded game */
    gamePage?: boolean;
    /** Additionally requires game.status.started */
    requiresStarted?: boolean;
    section: 'main' | 'reference';
}

export const NAV_ITEMS: NavItem[] = [
    { id: '', label: 'Home', Icon: HomeIcon, section: 'main' },
    { id: 'status', label: 'Board', Icon: SpaceDashboardIcon, gamePage: true, section: 'main' },
    { id: 'players', label: 'Players', Icon: GroupsIcon, gamePage: true, section: 'main' },
    { id: 'objectives', label: 'Objectives', Icon: EmojiEventsIcon, gamePage: true, section: 'main' },
    { id: 'planets', label: 'Planets', Icon: PublicIcon, gamePage: true, requiresStarted: true, section: 'main' },
    { id: 'factions', label: 'Factions', Icon: MenuBookIcon, section: 'reference' },
    { id: 'strategy-cards', label: 'Cards', Icon: StyleIcon, section: 'reference' },
];

/** Game-context items shown in the mobile bottom navigation */
export const BOTTOM_NAV_IDS = ['status', 'planets', 'objectives', 'players'];

export function getNavPath(item: NavItem, gameId?: string): string {
    return item.gamePage ? `/${gameId}/${item.id}` : `/${item.id}`;
}

/** Map the current pathname to the nav item id it belongs to */
export function getActiveNavId(pathname: string): string {
    const [, first = '', second = ''] = pathname.split('/');

    if (!first) {
        return '';
    }

    if (first === 'factions' || first === 'strategy-cards') {
        return first;
    }

    // /:gameId or /:gameId/<page>
    return second || 'status';
}
