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
    Switch,
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
    DMZPlanet,
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
type RowNameExclude = Exclude<RowName, 'trait' | 'DMZ'>;
const ROW_NAMES: RowName[] = [
    'resources',
    'influence',
    'biotic',
    'cybernetic',
    'propulsion',
    'warfare',
    'trait',
    'DMZ',
];
const ROW_ICON_MAP: Record<RowNameExclude, typeof Resources> = {
    resources: Resources,
    influence: Influence,
    biotic: Biotic,
    cybernetic: Cybernetic,
    propulsion: Propulsion,
    warfare: Warfare,
};

function MinusOne(props: { name: RowNameExclude; onClick: (name: RowNameExclude) => void }) {
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

function PlusOne(props: { name: RowNameExclude; onClick: (name: RowNameExclude) => void }) {
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
          name: RowNameExclude;
          Icon: (typeof ROW_ICON_MAP)[keyof typeof ROW_ICON_MAP];
          value: number; // base value
          modifier: number;
      }
    | {
          name: 'trait';
          Icon: typeof Trait;
          value: Traits | '';
          // undefined means use default planet value
          // [] means None
          modifier: Traits[] | undefined;
      }
    | {
          name: 'DMZ';
          Icon: typeof DMZPlanet;
          value: boolean;
          modifier: boolean;
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
                modifier: modifiers[name] || undefined,
            };
        } else if (name === 'DMZ') {
            return {
                name,
                Icon: DMZPlanet,
                value: planet[name] || false,
                modifier: modifiers[name] || false,
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

    const minusOne = (value: number | undefined, name: RowNameExclude) => {
        const base = planet[name] ?? 0;
        const newModifier = (value ?? 0) - 1;
        return base + newModifier >= 0 ? newModifier : -base;
    };
    const plusOne = (value: number | undefined) => (value !== undefined ? value + 1 : 1);
    const onMinusOneClick = (name: RowNameExclude) =>
        setModifiers(prev => ({ ...prev, [name]: minusOne(prev[name], name) }));
    const onPlusOneClick = (name: RowNameExclude) => setModifiers(prev => ({ ...prev, [name]: plusOne(prev[name]) }));

    const onTraitsChange: TextFieldProps['onChange'] = e => {
        setModifiers(prev => {
            let newTraits = e.target.value?.length ? (e.target.value as unknown as Traits[]) : [];

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

        if (rowData.modifier) {
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
                        {rows.map(r => {
                            const { name, value, Icon } = r;
                            let iconField = null;
                            let nameField: string = name;
                            let valueField = null;
                            let editField = null;
                            if (name === 'trait') {
                                iconField = <Icon trait={r.value} />;
                                nameField = 'Planet Trait(s)';
                                valueField = <ArrowIcon />;
                                editField = (
                                    <TextField
                                        fullWidth
                                        label={nameField}
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
                                );
                            } else if (name === 'DMZ') {
                                iconField = <Icon />;
                                editField = (
                                    <Switch
                                        value={r.value}
                                        onChange={e => setModifiers(prev => ({ ...prev, DMZ: e.target.checked }))}
                                    />
                                );
                            } else {
                                iconField = <Icon />;
                                valueField = <Typography>{`${r.value}+`}</Typography>;
                                editField = (
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
                                );
                            }
                            return (
                                <TableRow key={name}>
                                    <TableCell>{iconField}</TableCell>
                                    <TableCell sx={{ paddingLeft: 0, textWrap: 'nowrap' }}>
                                        <Typography>{nameField}</Typography>
                                    </TableCell>
                                    <TableCell>{valueField}</TableCell>
                                    <TableCell sx={{ padding: 1 }}>{editField}</TableCell>
                                </TableRow>
                            );
                        })}
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
