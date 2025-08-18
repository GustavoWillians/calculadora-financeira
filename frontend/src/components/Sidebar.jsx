import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';

const drawerWidth = 240;

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Financeira
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItem disablePadding component={RouterLink} to="/" sx={{ color: 'inherit', textDecoration: 'none' }}>
            <ListItemButton>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Visão Geral" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding component={RouterLink} to="/faturas" sx={{ color: 'inherit', textDecoration: 'none' }}>
            <ListItemButton>
              <ListItemIcon><CreditCardIcon /></ListItemIcon>
              <ListItemText primary="Faturas" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding component={RouterLink} to="/metas" sx={{ color: 'inherit', textDecoration: 'none' }}>
            <ListItemButton>
              <ListItemIcon><SavingsIcon /></ListItemIcon>
              <ListItemText primary="Metas" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}