import React from 'react';

import { Tooltip, Typography, TypographyProps } from '@material-ui/core';

import useTooltipOnClick from '../hooks/useTooltipOnClick';

export interface TextWithTooltipProps extends Omit<TypographyProps, 'noWrap'> {
    text: string;
    title?: string;
    width?: CSSStyleDeclaration['width'];
}

export default function TextWithTooltip(props: TextWithTooltipProps) {
    const { text, title, width, onClick, style: styleProp, ...TypographyProps } = props;
    const [open, onOpen, onClose] = useTooltipOnClick({ onTooltipOpen: onClick });
    const style = width ? { ...styleProp, width } : undefined;

    return (
        <Tooltip title={title ?? text} open={open} onClose={onClose}>
            <Typography {...TypographyProps} noWrap style={style} onClick={onOpen}>
                {text}
            </Typography>
        </Tooltip>
    );
}
