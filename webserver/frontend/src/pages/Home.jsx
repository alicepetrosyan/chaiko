import { Container, Stack, Grid, Typography, Box, Snackbar, Alert } from '@mui/material'
import { Link } from 'react-router-dom';
import theme from '../components/theme';
import { React, useState } from 'react'
import { useRecipeCatalog, syrupOrder } from '../store/recipe';
import { useEffect } from 'react';
import RecipeCard from '../components/RecipeCard';

const home = () => {

  const [snackSeverity, setSnackSeverity] = useState('success');
  const [snackMessage, setSnackMessage] = useState('');
  const [open, setOpen] = useState(false);

  const handleClose = (event, reason) => {
      if (reason === 'clickaway')
          return;
      setOpen(false);
  };

  const {deleteRecipe} = useRecipeCatalog();
  const handleDeleteRecipe = async (id) => {
      const { success, message } = await deleteRecipe(id);
      if (!success) 
          return { success: false, message };
      setSnackSeverity(success ? 'success' : 'error');
      setSnackMessage(message);
      setOpen(true);        
  };

  const {editRecipe} = useRecipeCatalog();
  const handleUpdateRecipe = async (id, updatedRecipe) => {
      const { success, message } = await editRecipe(id, updatedRecipe);
      if (!success) 
          return { success: false, message };
      setSnackSeverity(success ? 'success' : 'error');
      setSnackMessage(message);
      setOpen(true);
      return { success, message };
  };

  const handleSendStatus = (severity, message) => {
      setSnackSeverity(severity);
      setSnackMessage(message);
      setOpen(true);
  };

  const { fetchRecipes, recipes } = useRecipeCatalog();
  const { fetchOrder } = syrupOrder();

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);
  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  let noRecipes = false;

  if (recipes.length === 0) {
    noRecipes = true;
  }

  return (
    <Container sx={{width: '90vw', backgroundColor: (theme) => theme.palette.periwinkle.main, padding: 2, borderRadius: 2, boxShadow: 3, marginTop: 4, marginBottom:4, overflow: 'hidden'}}>
      <Typography
        fontSize={{
          base: "26px",
          xs: "35px"
        }}
        fontWeight={"bold"}
        textAlign={"center"}
        fontFamily={"DM Serif Display"}
        letterSpacing={"-2px"}
        color={theme.palette.contrastColor}>
        menu
      </Typography>

      <Box sx={{display: noRecipes ? 'block' : 'none'}}>
        <Typography
          fontSize='xl'
          fontWeight={"bold"}
          textAlign={"center"}
          fontFamily={"Comfortaa"}
          color={theme.palette.contrastColor}>
          no recipes found ;-; 
        </Typography>
        <Link to={"/createRecipe"} style={{color: theme.palette.link}}>
          <Typography
            fontSize='xl'
            fontWeight={"bold"}
            textAlign={"center"}
            fontFamily={"Comfortaa"}>
              create your first recipe!
          </Typography>
        </Link>
      </Box>
      <Grid container spacing={2} justifyContent={'left'} sx={{ padding: 2, width: '100%'}}>
        {recipes.map((recipe) => (
          <Grid size={{xs: 6, sm: 6, md: 4, lg: 3}}>
            <RecipeCard
              key={recipe._id}
              recipe={recipe}
              updatedRecipe={recipe}
              onDelete={handleDeleteRecipe}
              onUpdate={handleUpdateRecipe}
              onSendStatus={handleSendStatus}
            />
          </Grid>
        ))}
      </Grid>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
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
  )
}

export default home