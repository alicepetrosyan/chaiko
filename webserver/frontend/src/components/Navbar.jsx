import { Container, Box, Typography, Stack, Button } from '@mui/material'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Link as RouterLink} from 'react-router-dom';
import theme from './theme';
import React from 'react'

const Navbar = () => {
  return (
    <Box backgroundColor='periwinkle.main'>
    <Container minWidth="100vw">
      <Box 
        sx={{ display: 'flex'
        }} 
        height={"10vh"}
        alignItems={"center"}
        justifyContent={"space-between"}
        flexDirection={{
          base: "column",
          sm: "row"
        }}>
        <RouterLink to={"/"} style={{ textDecoration: 'none' }}>
          <Typography
            fontSize={{
              base: "26px",
              xs: "30px"
            }}
            fontWeight={"bold"}
            text-align={"center"}
            bg-clip={"text"}
            sx={{
              color: theme.palette.logoColor1,
              fontFamily: 'Gravitas One',
              letterSpacing: "-3px"
            }}>
            <p>chaiko</p>
          </Typography>
        </RouterLink>
        <Stack
          direction={"row"}
          spacing={2}
          alignItems={"center"}>
            <Button 
              component={RouterLink} 
              to="/config" 
              variant="contained"
              sx={{
                backgroundColor: theme.palette.contrastColor,
                color: 'periwinkle.main'
              }}><SettingsRoundedIcon />
            </Button>

            <Button 
              component={RouterLink} 
              to="/createRecipe" 
              variant="contained"
              sx={{
                backgroundColor: theme.palette.contrastColor,
                color: 'periwinkle.main'
              }}><AddRoundedIcon />
            </Button>

        </Stack>
      </Box>
    </Container>
    </Box>
  )
}

export default Navbar