import React, {useState, useEffect} from 'react'
import { theme, darkTheme } from './theme';
import { useRecipeCatalog, syrupOrder } from '../store/recipe';
import { Box, Typography, Grid, Button, IconButton, Modal, Container, Stack, ThemeProvider, TextField, Autocomplete, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import Syrup from '../RecipeClass';

const WS_URL = 'ws://localhost:8000/ws/orders';
// const WS_URL = 'ws://192.168.0.185:8000/ws/orders';

const RecipeCard = ({recipe, updatedRecipe, onDelete, onUpdate, onSendStatus}) => {
    const maxSyrups = 4;
    const { recipes } = useRecipeCatalog();
    const { order } = syrupOrder();

    // State for modal open/close
    const [isOpen, setOpen] = React.useState(false);
    const handleOpen = () => {
        // seed the edit form with the current recipe's values,
        // padded out to maxSyrups so there are always empty slots to fill in
        const existingSyrups = recipe.syrups.map((s) => new Syrup(s.name, s.pumps));
        const paddedSyrups = [...existingSyrups];
        while (paddedSyrups.length < maxSyrups) {
            paddedSyrups.push(new Syrup('', ''));
        }
        setNewRecipe({
            name: recipe.name,
            image: recipe.image,
            syrups: paddedSyrups,
        });
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    // update recipe
      const [newRecipe, setNewRecipe] = useState({
        name: '',
        syrups: [new Syrup('', ''), new Syrup('', ''), new Syrup('', ''), new Syrup('', '')],
        image: '',
    });
      const [syrupOptions, setSyrupOptions] = useState([]); // Dropdown options for syrups

      useEffect(() => {
        const uniqueSyrups = Array.from(
          new Set(
            recipes.flatMap((recipe) => recipe.syrups.map((syrup) => syrup.name).filter(Boolean))
          )
        );
        setSyrupOptions(uniqueSyrups);
      }, [recipes]);

    // --- available syrup order (in-stock list, in dispenser order) ---
    // syrups this recipe needs that aren't in the available order list
    const unavailableSyrups = recipe.syrups
        .filter((syrup) => syrup.name && !order.includes(syrup.name))
        .map((syrup) => syrup.name);
    const canSend = unavailableSyrups.length === 0;
    // --- sending the order over websocket ---
    const [sending, setSending] = useState(false);
    const handleSend = () => {
        if (!canSend || sending) return;
        setSending(true);

        const orderedPumpCounts = Array(order.length).fill(0);
        order.forEach((syrupName, index) => {
            if (!syrupName || syrupName === 'none') {
                orderedPumpCounts[index] = 0;
                return;
            }
            const matchingSyrup = recipe.syrups.find((s) => s.name === syrupName);
            orderedPumpCounts[index] = matchingSyrup ? Number(matchingSyrup.pumps || 0) : 0;
        });

        const socket = new WebSocket(WS_URL);
        let timeoutId = null;
        let acknowledged = false;

        const finish = (severity, message) => {
            if (acknowledged) return;
            acknowledged = true;
            if (timeoutId) clearTimeout(timeoutId);
            setSending(false);
            if (onSendStatus) onSendStatus(severity, message);
            socket.close();
        };

        socket.onopen = () => {
            const payload = JSON.stringify({
                name: recipe.name,
                pumps: orderedPumpCounts,
            });
            socket.send(payload);
            timeoutId = setTimeout(() => {
                finish('error', 'Order timed out waiting for machine acknowledgment.');
            }, 8000);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'order_ack') {
                    finish(data.success ? 'success' : 'error', data.message || 'Order sent.');
                    return;
                }
                console.log('WS message:', data);
            } catch (error) {
                console.log('WS message:', event.data);
            }
        };

        socket.onerror = (err) => {
            console.error('WebSocket error sending order:', err);
            finish('error', 'Unable to connect to the machine.');
        };

        socket.onclose = () => {
            if (!acknowledged) {
                setSending(false);
                if (onSendStatus) onSendStatus('error', 'Order could not be confirmed.');
            }
        };
    };

  return (
    <Box
        sx={{
        backgroundColor: theme.palette.contrastColor,
        boxShadow: 3,
        padding: 2,
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6,
        },
      }}>
        <Box role="img" aria-label={recipe.name}
          sx={{
            filter: 'sepia(25%)',
            borderRadius: 2,
            width: '100%',
            height: 0,
            paddingTop: '100%',
            backgroundImage: `url(${recipe.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }}/>
        <Box sx={{marginTop: 0.5}}>
            <Typography fontSize={{md: "22px", xs: "20px"}} style={{color: theme.palette.periwinkle.dark, fontFamily: 'DM Serif Display', marginBottom: 6}}>{recipe.name}</Typography>
            
            <Grid container spacing={0} justifyContent={'left'} alignItems={'stretch'} sx={{ paddingLeft: {md: 4, xs: 2}, width: '100%'}}>
                <Grid size={{xs: 10}}>
                    {recipe.syrups.map((syrup, index) => (
                        <Typography key={index} margin={-1} fontSize={{md: "16px", xs: "14px"}} style={{color: unavailableSyrups.includes(syrup.name) ? theme.palette.disabled : theme.palette.periwinkle.main, fontFamily: 'DM Serif Display'}}> {syrup.name} </Typography>
                    ))}
                {Array.from({ length: maxSyrups - recipe.syrups.length }).map((_, index) => (
                    <Typography
                        key={`empty-name-${index}`}
                        margin={-1}
                        fontSize={{ md: '16px', xs: '14px' }}
                        style={{
                        color: 'transparent', // Invisible text to create space
                        fontFamily: 'DM Serif Display'
                        }}>
                        hehehehehehehe 
                    </Typography>  //credit: alexandra secara for the hehehehehehehe
                ))}
                </Grid>
                <Grid size={{xs: 2}}  justifyContent={'right'}>
                    {recipe.syrups.map((syrup, index) => (
                        <Typography key={index} margin={-1} fontSize={{md: "16px", xs: "14px"}} style={{color: unavailableSyrups.includes(syrup.name) ? theme.palette.disabled : theme.palette.periwinkle.main, fontFamily: 'DM Serif Display'}}> × {syrup.pumps} </Typography>
                    ))}
                {Array.from({ length: maxSyrups - recipe.syrups.length }).map((_, index) => (
                    <Typography
                        key={`empty-pumps-${index}`}
                        margin={-1}
                        fontSize={{ md: '16px', xs: '14px' }}
                        style={{
                        color: 'transparent', // Invisible text to create space
                        fontFamily: 'DM Serif Display',
                        }}>
                        × 0
                    </Typography>
                ))}
                </Grid>
            </Grid>
            <Grid container spacing={0} justifyContent={{ xs: 'space-between' }} sx={{width: '100%', paddingTop: 1}}>
                <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: { xs: 'left'} }}>
                    <IconButton size="small" variant="outlined" onClick={() => onDelete(recipe._id)}>
                        <DeleteIcon />
                    </IconButton>
                    <IconButton variant="outlined" size="small" onClick={() => handleOpen()}>
                        <EditIcon />
                    </IconButton>
                </Grid>                
                <Grid size={{xs: 0, sm: 2, md: 3}} />
                <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: { xs: 'middle', sm: 'middle', md: 'flex-end', lg: 'flex-end' } }}>
                    <Tooltip title={canSend ? '': `Order cannot be fulfilled: ${unavailableSyrups.join(', ')} out of stock`} disableHoverListener={canSend} >
                        <span>
                            <Button
                                variant="contained"
                                size="small"
                                endIcon={<SendIcon />}
                                disabled={!canSend || sending}
                                onClick={handleSend}
                                sx={{
                                    backgroundColor: canSend ? theme.palette.periwinkle.light : undefined,
                                    fontFamily: "Comfortaa",
                                    textTransform: 'none',
                                }}
                            >
                                <b>{sending ? 'sending...' : 'send'}</b>
                            </Button>
                        </span>
                    </Tooltip>
                </Grid>
            </Grid>
        </Box>

        <Modal open={isOpen} onClose={handleClose}>
            <Container
                maxWidth="xs"
                sx={{
                    backgroundColor: (theme) => theme.palette.periwinkle.main,
                    padding: 2,
                    paddingBottom: 0,
                    borderRadius: 2,
                    boxShadow: 3,
                    marginTop: 12,
                }}
                >
                <Stack direction={'column'} spacing={4} padding={2} alignItems={'center'}>
                    <Typography
                    fontSize={{
                        base: '20px',
                        xs: '28px',
                    }}
                    fontWeight={'bold'}
                    textAlign={'center'}
                    fontFamily={'DM Serif Display'}
                    letterSpacing={'-2px'}
                    color={theme.palette.contrastColor}
                    >
                    update recipe
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                    <Stack direction={'column'} spacing={2}>
                        <ThemeProvider theme={darkTheme}>
                        <TextField
                            id="recipeName"
                            label="Name"
                            variant="outlined"
                            size="small"
                            value={newRecipe.name}
                            onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                        />
                        <TextField
                            id="imageURL"
                            label="Image URL"
                            variant="outlined"
                            size="small"
                            value={newRecipe.image}
                            onChange={(e) => setNewRecipe({ ...newRecipe, image: e.target.value })}
                        />
                        {newRecipe.syrups.map((syrup, index) => (
                            <Grid container spacing={2} key={index}>
                            <Grid item size={8}>
                                <Autocomplete
                                freeSolo
                                includeInputInList
                                options={syrupOptions}
                                value={syrup.name}
                                onChange={(e, newValue) => {
                                    // Handles selecting from dropdown
                                    const updatedSyrups = [...newRecipe.syrups];
                                    updatedSyrups[index] = new Syrup(newValue ?? '', syrup.pumps);
                                    setNewRecipe({ ...newRecipe, syrups: updatedSyrups });
                                    // Add to options if it's new
                                    if (newValue && !syrupOptions.includes(newValue)) {
                                    setSyrupOptions((prev) => [...prev, newValue]);
                                    }
                                }}
                                onInputChange={(e, newInputValue) => {
                                    // Handles freeform typing
                                    const updatedSyrups = [...newRecipe.syrups];
                                    updatedSyrups[index] = new Syrup(newInputValue, syrup.pumps);
                                    setNewRecipe({ ...newRecipe, syrups: updatedSyrups });
                                }}
                                onBlur={() => {
                                    // When user clicks away, add typed value to options if new
                                    if (syrup.name && !syrupOptions.includes(syrup.name)) {
                                    setSyrupOptions((prev) => [...prev, syrup.name]);
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label={`Syrup ${index + 1}`} variant="outlined" size="small" />
                                )}
                                />
                            </Grid>
                            <Grid item size={4}>
                                <TextField
                                id={`recipePumps${index + 1}`}
                                label="Pumps"
                                variant="outlined"
                                size="small"
                                value={syrup.pumps}
                                onChange={(e) => {
                                    const updatedSyrups = [...newRecipe.syrups];
                                    updatedSyrups[index] = new Syrup(syrup.name, Number(e.target.value));
                                    setNewRecipe({ ...newRecipe, syrups: updatedSyrups });
                                }}
                            />
                            </Grid>
                            </Grid>
                        ))}
                        </ThemeProvider>
                        <Button
                        onClick={async () => {
                            const cleanedSyrups = newRecipe.syrups.filter(
                                (syrup) => syrup.name && syrup.pumps !== '' && syrup.pumps !== null && syrup.pumps !== undefined
                            );
                            await onUpdate(recipe._id, { ...newRecipe, syrups: cleanedSyrups });
                            handleClose();
                        }}
                        variant="contained"
                        sx={{
                            backgroundColor: theme.palette.contrastColor,
                            color: 'periwinkle.main',
                            fontWeight: 'bold',
                            fontSize: 'x-large',
                            width: '50%',
                            alignSelf: 'center',
                            padding: 1,
                            fontFamily: 'DM Serif Display',
                            letterSpacing: '-1px',
                            textTransform: 'none',
                        }}
                        >
                        save changes
                        </Button>
                    </Stack>
                    </Box>
                </Stack>
                </Container>
        </Modal>
    </Box>
  )
}

export default RecipeCard