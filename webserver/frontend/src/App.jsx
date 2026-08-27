import React from 'react';
import ReactDOM from 'react-dom';
import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/navbar';
import Home from './pages/Home';
import Config from './pages/Config';
import CreateRecipe from './pages/CreateRecipe';
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from './components/theme';

function App() {

  return (
    <>
    <ThemeProvider theme={theme}>
    <CssBaseline />
    <Box minH={'100vh'}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<Config />} />
        <Route path="/createRecipe" element={<CreateRecipe />} />
      </Routes>
    </Box>
    </ThemeProvider>
    </>
  )
}

export default App;
