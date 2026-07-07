import confetti from 'canvas-confetti';
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Results from '../components/Results';
import { PageContainer } from '../components/ui';
import useGameInfo from '../hooks/useGameInfo';

function GameResults() {
    // Only calling for the rerender. There is a bug where the returned location is stale.
    useLocation();

    const navigate = useNavigate();
    const { game, gameId } = useGameInfo();
    const animationIdRef = useRef(0);

    const url = window.location.pathname;
    useEffect(() => {
        if (url !== `/${gameId}/results`) {
            if (animationIdRef.current) {
                window.clearInterval(animationIdRef.current);
            }
            return;
        }

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
            });
        };

        animationIdRef.current = window.setInterval(frame, 100);
        return () => window.clearInterval(animationIdRef.current);
    }, [url]);

    useEffect(() => {
        if (!game || !gameId) {
            navigate('/');
        } else if (!game.status.ended) {
            navigate(`/${gameId}/status`);
        }
    }, [game, gameId, game?.status.ended]);

    if (!game || !game.status.ended) {
        return null;
    }

    return (
        <PageContainer maxWidth={760}>
            <Results />
        </PageContainer>
    );
}

export default GameResults;
