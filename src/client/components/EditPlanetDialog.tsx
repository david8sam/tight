import React, { useState } from 'react';

import AddIcon from '@mui/icons-material/AddCircle';
import ArrowIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import MinusIcon from '@mui/icons-material/RemoveCircle';
import {
    AppBar,
    Button,
    Dialog,
    DialogContent,
    Grid,
    IconButton,
    IconButtonProps,
    MenuItem,
    SxProps,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TextField,
    TextFieldProps,
    Theme,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material';

import { MessageType } from 'common/message';

import useGameInfo from '../hooks/useGameInfo';

import { useAppContext } from '../Context';
import { PlanetData } from '../types';

import {
    Biotic,
    Cybernetic,
    Influence,
    Propulsion,
    Resources,
    Warfare,
    Cultural,
    Industrial,
    Hazardous,
} from './PlanetIcons';
import { Traits } from 'common/Planet';

const styles: Record<string, SxProps<Theme>> = {
    appBar: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center',
        paddingRight: 2,
    },
    title: {
        marginLeft: 2,
        flex: 1,
    },
    gridItem: {
        width: '100%',
    },
    joinButton: {
        marginTop: 2,
    },
};

type RowName = keyof NonNullable<PlanetData['modifiers']>;
type RowNameExcludeTrait = Exclude<RowName, 'trait'>;
const ROW_NAMES: RowName[] = ['resources', 'influence', 'biotic', 'cybernetic', 'propulsion', 'warfare', 'trait'];
const ROW_ICON_MAP: Record<RowNameExcludeTrait, typeof Resources> = {
    resources: Resources,
    influence: Influence,
    biotic: Biotic,
    cybernetic: Cybernetic,
    propulsion: Propulsion,
    warfare: Warfare,
};

function MinusOne(props: { name: RowNameExcludeTrait; onClick: (name: RowNameExcludeTrait) => void }) {
    const { name, onClick } = props;
    const onClickHandler: IconButtonProps['onClick'] = e => {
        e.stopPropagation();
        e.preventDefault();
        onClick(name);
    };

    return (
        <Tooltip title="Minus One">
            <IconButton onClick={onClickHandler}>
                <MinusIcon />
            </IconButton>
        </Tooltip>
    );
}

function PlusOne(props: { name: RowNameExcludeTrait; onClick: (name: RowNameExcludeTrait) => void }) {
    const { name, onClick } = props;
    const onClickHandler: IconButtonProps['onClick'] = e => {
        e.stopPropagation();
        e.preventDefault();
        onClick(name);
    };

    return (
        <Tooltip title="Plus One">
            <IconButton onClick={onClickHandler}>
                <AddIcon />
            </IconButton>
        </Tooltip>
    );
}

function Trait(props: { trait: Traits | '' }) {
    switch (props.trait) {
        case Traits.CULTURAL:
            return <Cultural />;
        case Traits.HAZARDOUS:
            return <Hazardous />;
        case Traits.INDUSTRIAL:
            return <Industrial />;
        default:
            return null;
    }
}

type RowData =
    | {
          name: RowNameExcludeTrait;
          Icon: (typeof ROW_ICON_MAP)[keyof typeof ROW_ICON_MAP];
          value: number; // base value
          modifier: number;
      }
    | {
          name: 'trait';
          Icon: typeof Trait;
          value: Traits | '';
          modifier: Traits[];
      };

export interface PlayerNameDialogProps {
    open: boolean;
    onClose?: () => void;
    planet: PlanetData;
}

export default function EditPlanetDialog(props: PlayerNameDialogProps) {
    const { open, onClose, planet } = props;
    const { name: planetId, modifiers: planetModifiers = {} } = planet;
    const { sendData } = useAppContext();
    const { gameId } = useGameInfo();

    const [modifiers, setModifiers] = useState(planetModifiers);

    const rows: RowData[] = ROW_NAMES.map(name => {
        if (name === 'trait') {
            return {
                name,
                Icon: Trait,
                value: planet[name] || '',
                modifier: modifiers[name] || [],
            };
        }

        return {
            name,
            Icon: ROW_ICON_MAP[name],
            value: planet[name] || 0,
            modifier: modifiers[name] || 0,
        };
    });

    const onSave = () => {
        sendData({ type: MessageType.UPDATE_PLANET, data: { gameId, planetId, modifiers } });
        onClose?.();
    };

    const minusOne = (value: number | undefined, name: RowNameExcludeTrait) => {
        const base = planet[name] ?? 0;
        const newModifier = (value ?? 0) - 1;
        return base + newModifier >= 0 ? newModifier : -base;
    };
    const plusOne = (value: number | undefined) => (value !== undefined ? value + 1 : 1);
    const onMinusOneClick = (name: RowNameExcludeTrait) =>
        setModifiers(prev => ({ ...prev, [name]: minusOne(prev[name], name) }));
    const onPlusOneClick = (name: RowNameExcludeTrait) =>
        setModifiers(prev => ({ ...prev, [name]: plusOne(prev[name]) }));

    const onTraitsChange: TextFieldProps['onChange'] = e => {
        setModifiers(prev => {
            let newTraits = e.target.value?.length ? (e.target.value as unknown as Traits[]) : undefined;

            // Remove modifier if selected trait is the same as the planet's trait.
            if (newTraits?.length === 1 && newTraits[0] === planet.trait) {
                const newModifers = { ...prev };
                delete newModifers.trait;
            }

            return { ...prev, trait: newTraits };
        });
    };

    const getPlanetTraits = (rowData: RowData) => {
        if (rowData.name !== 'trait') {
            return [];
        }

        if (rowData.modifier?.length) {
            return rowData.modifier;
        }

        return planet.trait ? [planet.trait] : [];
    };

    return (
        <Dialog open={open} fullScreen>
            <AppBar sx={styles.appBar}>
                <Toolbar>
                    <Tooltip title="Close">
                        <IconButton onClick={onClose} size="large">
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
                <Typography variant="h6" sx={styles.title}>
                    {`Edit ${planetId}`}
                </Typography>
                <Button autoFocus color="inherit" onClick={onSave}>
                    Save
                </Button>
            </AppBar>
            <DialogContent dividers sx={{ padding: 0 }}>
                <Table size="small">
                    <TableBody>
                        {rows.map(r => (
                            <TableRow key={r.name}>
                                <TableCell>{r.name === 'trait' ? <r.Icon trait={r.value} /> : <r.Icon />}</TableCell>
                                <TableCell sx={{ paddingLeft: 0, textWrap: 'nowrap' }}>
                                    <Typography>{r.name === 'trait' ? 'Planet Trait(s)' : r.name}</Typography>
                                </TableCell>
                                <TableCell>
                                    {r.name === 'trait' ? <ArrowIcon /> : <Typography>{`${r.value}+`}</Typography>}
                                </TableCell>
                                <TableCell sx={{ padding: 1 }}>
                                    {r.name === 'trait' ? (
                                        <TextField
                                            fullWidth
                                            label="Planet Trait(s)"
                                            InputLabelProps={{ shrink: true }}
                                            onChange={onTraitsChange}
                                            select
                                            value={getPlanetTraits(r)}
                                            variant="outlined"
                                            SelectProps={{
                                                multiple: true,
                                                displayEmpty: true,
                                                renderValue: value => {
                                                    const valueArray = value as string[];
                                                    return valueArray?.length ? (
                                                        <Grid container>
                                                            {valueArray.map(v => (
                                                                <Trait trait={v as Traits} key={v} />
                                                            ))}
                                                        </Grid>
                                                    ) : (
                                                        'NONE'
                                                    );
                                                },
                                            }}
                                        >
                                            {Object.entries(Traits).map(([key, value]) => (
                                                <MenuItem key={key} value={value}>
                                                    <r.Icon trait={value} />
                                                    <Typography sx={{ paddingLeft: 1 }}>{key}</Typography>
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    ) : (
                                        <TextField
                                            fullWidth
                                            type="number"
                                            value={r.modifier}
                                            inputProps={{ sx: { textAlign: 'center' } }}
                                            InputProps={{
                                                sx: { padding: 0 },
                                                readOnly: true,
                                                startAdornment: <MinusOne name={r.name} onClick={onMinusOneClick} />,
                                                endAdornment: <PlusOne name={r.name} onClick={onPlusOneClick} />,
                                            }}
                                        />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Toolbar />
                <Toolbar>
                    <Button
                        sx={{ margin: 1 }}
                        fullWidth
                        color="primary"
                        variant="contained"
                        size="large"
                        onClick={onSave}
                    >
                        Save
                    </Button>
                </Toolbar>
                <Toolbar>
                    <Button
                        sx={{ margin: 1 }}
                        fullWidth
                        color="primary"
                        variant="contained"
                        size="large"
                        onClick={() => setModifiers({})}
                    >
                        Reset
                    </Button>
                </Toolbar>
            </DialogContent>
        </Dialog>
    );
}
