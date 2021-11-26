import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export interface AutoNavigateOptions {
    to: string;
    condition?: () => boolean; // default true
    deps?: unknown[];
}

export default function useAutoNavigate(options: AutoNavigateOptions): void {
    const { condition, to, deps } = options;
    const navigate = useNavigate();

    useEffect(() => {
        if (!condition || condition()) {
            navigate(to);
        }
    }, deps);
}
