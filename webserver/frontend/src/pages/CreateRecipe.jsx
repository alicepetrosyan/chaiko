import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Stack, TextField, ThemeProvider, Grid, Button, Alert, Snackbar, Autocomplete } from '@mui/material';
import theme, {darkTheme} from '../components/theme';
import Syrup from '../RecipeClass';
import { useRecipeCatalog } from '../store/recipe';

const CreateRecipe = () => {
  const createRecipe = useRecipeCatalog((state) => state.createRecipe);
  const { fetchRecipes, recipes } = useRecipeCatalog();

  const [newRecipe, setNewRecipe] = useState({
    name: '',
    syrups: [new Syrup('', ''), new Syrup('', ''), new Syrup('', ''), new Syrup('', '')],
    image: '',
  });

  const [snackSeverity, setSnackSeverity] = useState('success');
  const [snackMessage, setSnackMessage] = useState('');
  const [open, setOpen] = useState(false);

  const [syrupOptions, setSyrupOptions] = useState([]); // Dropdown options for syrups

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    const uniqueSyrups = Array.from(
      new Set(
        recipes
          .flatMap((recipe) => recipe.syrups.map((syrup) => syrup.name).filter(Boolean))
      )
    );
    setSyrupOptions(uniqueSyrups);
  }, [recipes]);

  const handleAddRecipe = async () => {
    // Filter out syrups that are not populated (empty name or pumps)
    const validSyrups = newRecipe.syrups.filter(
      (syrup) => syrup.name && syrup.name.trim() !== '' && syrup.pumps !== undefined && syrup.pumps !== null
    );

    // Ensure at least one valid syrup is added
    if (validSyrups.length === 0) {
      setSnackSeverity('error');
      setSnackMessage('At least one syrup must be added to the recipe.');
      setOpen(true);
      return;
    }

    const payload = {
      name: newRecipe.name,
      image: newRecipe.image,
      syrups: validSyrups, // Only send valid syrups
    };

    console.log('Recipe being sent:', payload);

    const { success, message } = await createRecipe(payload);

    setSnackSeverity(success ? 'success' : 'error');
    setSnackMessage(message);
    setOpen(true);

    console.log('Success: ', success, 'Message: ', message);
  };

  const navigate = useNavigate();

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);

    setNewRecipe({
      name: '',
      syrups: [new Syrup('', ''), new Syrup('', ''), new Syrup('', ''), new Syrup('', '')],
      image: '',
    });

    if (snackSeverity === 'success')
      navigate('/'); // redirect to home page after recipe is created successfully
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        backgroundColor: (theme) => theme.palette.periwinkle.main,
        padding: 2,
        borderRadius: 2,
        boxShadow: 3,
        marginTop: 4,
        marginBottom: 4,
        paddingBottom: 0,
      }}
    >
      <Stack direction={'column'} spacing={8} padding={8} alignItems={'center'}>
        <Typography
          fontSize={{
            base: '26px',
            xs: '35px',
          }}
          fontWeight={'bold'}
          textAlign={'center'}
          fontFamily={'DM Serif Display'}
          letterSpacing={'-2px'}
          color={theme.palette.contrastColor}
        >
          create new recipe
        </Typography>
        <Box sx={{ width: '100%' }}>
          <Stack direction={'column'} spacing={4}>
            <ThemeProvider theme={darkTheme}>
              <TextField
                id="recipeName"
                label="Name"
                variant="outlined"
                value={newRecipe.name}
                onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
              />
              <TextField
                id="imageURL"
                label="Image URL"
                variant="outlined"
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
                        <TextField {...params} label={`Syrup ${index + 1}`} variant="outlined" />
                      )}
                    />
                  </Grid>
                  <Grid item size={4}>
                    <TextField
                      id={`recipePumps${index + 1}`}
                      label="Pumps"
                      variant="outlined"
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
              onClick={() => {
                handleAddRecipe();
              }}
              variant="contained"
              sx={{
                backgroundColor: theme.palette.contrastColor,
                color: 'periwinkle.main',
                fontWeight: 'bold',
                fontSize: 'x-large',
                width: '75%',
                alignSelf: 'center',
                padding: 1,
                fontFamily: 'DM Serif Display',
                letterSpacing: '-1px',
                textTransform: 'none',
              }}
            >
              create recipe
            </Button>
          </Stack>
        </Box>
      </Stack>
      <Snackbar open={open} autoHideDuration={1000} onClose={handleClose}>
        <Alert
          onClose={handleClose}
          severity={snackSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateRecipe;