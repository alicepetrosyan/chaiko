import React, { useEffect } from 'react'; 
import theme, { darkTheme } from '../components/theme';
import { syrupOrder, useRecipeCatalog } from '../store/recipe';
import { Container, Typography, Grid, Autocomplete, TextField, ThemeProvider } from '@mui/material';

const Config = () => {
  const { order, setOrder, fetchOrder, saveOrder } = syrupOrder(); // Access syrupOrder store
  const { fetchRecipes, recipes } = useRecipeCatalog(); // Access recipes from the recipe catalog

  const [syrupOptions, setSyrupOptions] = React.useState(['none']); // Dropdown options for syrups

  // Fetch the syrup order and recipes from the backend
  useEffect(() => {
    fetchOrder(); // Fetch the syrup order when the component mounts
    fetchRecipes(); // Fetch all recipes to populate syrup options
  }, [fetchOrder, fetchRecipes]);

  // Populate syrup options from recipes
  useEffect(() => {
    const uniqueSyrups = Array.from(
      new Set(['none', ...recipes.flatMap((recipe) => recipe.syrups.map((syrup) => syrup.name).filter(Boolean))])
    );
    setSyrupOptions(uniqueSyrups);
  }, [recipes]);

  // Handle pump configuration changes
  const handlePumpChange = (pumpNumber, newValue) => {
    const normalizedValue = newValue === null || newValue === undefined ? 'none' : String(newValue).trim() || 'none';
    const updatedOrder = [...order];
    updatedOrder[pumpNumber - 1] = normalizedValue;
    setOrder(updatedOrder);
    saveOrder(updatedOrder);
  };

  return (
    <Container
      sx={{
        justifyItems: 'center',
        width: '90vw',
        backgroundColor: (theme) => theme.palette.periwinkle.main,
        padding: 2,
        borderRadius: 2,
        boxShadow: 3,
        marginTop: 4,
        marginBottom: 4,
        overflow: 'hidden',
      }}
    >
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
        machine configuration
      </Typography>

      <Typography
        padding={2}
        fontSize="xl"
        fontWeight={'bold'}
        textAlign={'center'}
        fontFamily={'Comfortaa'}
        color={theme.palette.contrastColor}
      >
        select the syrups that are currently in the machine and the corresponding pump that they are attached to.
      </Typography>

      <Grid
        container
        spacing={2}
        alignItems="center"
        direction="column"
        sx={{ marginTop: 2, width: '100%', paddingBottom: 4 }}
      >
        {[1, 2, 3, 4].map((pumpNumber) => (
          <Grid item xs={12} sm={6} key={pumpNumber} width={'40vw'} padding={1}>
            <ThemeProvider theme={darkTheme}>
              <Autocomplete
                freeSolo // Allow typing custom values
                options={syrupOptions} // Populate dropdown with syrup options
                value={order[pumpNumber - 1] || 'none'} // Bind value to syrupOrder
                onChange={(event, newValue) => handlePumpChange(pumpNumber, newValue)} // Update order on selection
                renderInput={(params) => (
                  <TextField {...params} label={`Pump ${pumpNumber}`} variant="outlined" />
                )}
              />
            </ThemeProvider>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Config;