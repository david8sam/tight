import { Phase } from 'common/Game';

export const PHASE_LABELS: Record<Phase, string> = {
    [Phase.STRATEGY]: 'Strategy',
    [Phase.ACTION]: 'Action',
    [Phase.STATUS]: 'Status',
    [Phase.AGENDA]: 'Agenda',
};
