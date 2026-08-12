import React, { useMemo, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";

import NotificationBell from "../notifications/NotificationBell";
import { useAppDispatch, useAppSelector } from "../../store";
import { logout } from "../../store/slices/authSlice";

interface LayoutProps {
  children: React.ReactNode;
}
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const drawerWidth = 248;
const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: <DashboardOutlinedIcon />,
      },
      { label: "Leads", path: "/leads", icon: <PeopleAltOutlinedIcon /> },
      { label: "Clients", path: "/clients", icon: <GroupsOutlinedIcon /> },
      {
        label: "Projects",
        path: "/projects",
        icon: <AccountTreeOutlinedIcon />,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Invoices",
        path: "/invoices",
        icon: <ReceiptLongOutlinedIcon />,
      },
      { label: "Payments", path: "/payments", icon: <PaidOutlinedIcon /> },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        label: "Analytics",
        path: "/analytics",
        icon: <AnalyticsOutlinedIcon />,
      },
      {
        label: "AI insights",
        path: "/ai-insights",
        icon: <AutoAwesomeOutlinedIcon />,
      },
      { label: "Reports", path: "/reports", icon: <SummarizeOutlinedIcon /> },
      {
        label: "Executive",
        path: "/executive",
        icon: <InsightsOutlinedIcon />,
      },
      {
        label: "Proposals",
        path: "/proposals",
        icon: <DescriptionOutlinedIcon />,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Follow-ups",
        path: "/follow-ups",
        icon: <EventRepeatOutlinedIcon />,
      },
      { label: "Activity", path: "/activity", icon: <HistoryOutlinedIcon /> },
      {
        label: "Automation",
        path: "/automation",
        icon: <AutorenewOutlinedIcon />,
      },
    ],
  },
];

const Layout = ({ children }: LayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentItem = useMemo(
    () =>
      navGroups
        .flatMap((group) => group.items)
        .find((item) => location.pathname.startsWith(item.path)),
    [location.pathname]
  );
  const currentLabel = location.pathname.startsWith("/profile")
    ? "My profile"
    : currentItem?.label ?? "ClientFlow";
  const initials =
    `${user?.first_name?.[0] ?? ""}${
      user?.last_name?.[0] ?? ""
    }`.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "C";

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  const drawerContent = (
    <Stack sx={{ height: "100%", bgcolor: "#111A2D", color: "#F5F7FC" }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ height: 68, px: 2.25 }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 2,
            bgcolor: "primary.main",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 12,
              height: 12,
              borderRadius: "3px",
              bgcolor: "#FFFFFF",
              left: 5,
              top: 5,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: 9,
              height: 9,
              borderRadius: "3px",
              bgcolor: "#91A4FF",
              right: 4,
              bottom: 4,
            }}
          />
        </Box>
        <Typography
          component={RouterLink}
          to="/dashboard"
          variant="h6"
          sx={{
            color: "inherit",
            textDecoration: "none",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          ClientFlow
        </Typography>
      </Stack>
      <Box
        component="nav"
        aria-label="Main navigation"
        sx={{ flex: 1, overflowY: "auto", px: 1.25, py: 1 }}
      >
        {navGroups.map((group, groupIndex) => (
          <Box key={group.label} sx={{ mb: 1.75 }}>
            {groupIndex > 0 ? (
              <Divider
                sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 1.75 }}
              />
            ) : null}
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: "#92A0B8",
                px: 1.25,
                mb: 0.75,
                fontWeight: 700,
              }}
            >
              {group.label}
            </Typography>
            <List disablePadding>
              {group.items.map((item) => {
                const selected = location.pathname.startsWith(item.path);
                return (
                  <ListItemButton
                    key={item.path}
                    component={RouterLink}
                    to={item.path}
                    selected={selected}
                    onClick={() => setDrawerOpen(false)}
                    sx={{
                      minHeight: 40,
                      px: 1.25,
                      mb: 0.25,
                      color: selected ? "#FFFFFF" : "#B8C2D3",
                      "& .MuiListItemIcon-root": {
                        color: selected ? "#AEBBFF" : "#7F8DA6",
                      },
                      "&.Mui-selected": { bgcolor: "rgba(95, 122, 255, 0.18)" },
                      "&.Mui-selected:hover": {
                        bgcolor: "rgba(95, 122, 255, 0.24)",
                      },
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.06)",
                        color: "#FFFFFF",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 34, "& svg": { fontSize: 19 } }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 13.5,
                        fontWeight: selected ? 700 : 550,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 1.25 }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 1.25 }} />
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ p: 0.5 }}
        >
          <ButtonBase
            component={RouterLink}
            to="/profile"
            aria-label="Open my profile"
            sx={{
              flex: 1,
              minWidth: 0,
              justifyContent: "flex-start",
              gap: 1.25,
              p: 0.75,
              borderRadius: 1,
              textAlign: "left",
              "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            <Avatar
              src={user?.profile_photo_url ?? undefined}
              alt={
                user?.first_name
                  ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                  : "Profile photo"
              }
              sx={{
                width: 34,
                height: 34,
                bgcolor: "#304060",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{ color: "#FFFFFF", fontWeight: 700 }}
              >
                {user?.first_name
                  ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                  : "Workspace member"}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: "#92A0B8", display: "block" }}
              >
                {user?.organization_name || user?.email}
              </Typography>
            </Box>
          </ButtonBase>
          <Tooltip title="Sign out">
            <IconButton
              size="small"
              onClick={handleLogout}
              aria-label="Sign out"
              sx={{
                color: "#AAB5C8",
                "&:hover": {
                  color: "#FFFFFF",
                  bgcolor: "rgba(255,255,255,0.08)",
                },
              }}
            >
              <LogoutOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: { md: drawerWidth },
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: drawerWidth, border: 0 },
        }}
      >
        {drawerContent}
      </Drawer>

      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "rgba(255,255,255,0.96)",
        }}
      >
        <Toolbar sx={{ minHeight: "64px !important", px: { xs: 2, md: 3 } }}>
          {isMobile ? (
            <IconButton
              edge="start"
              aria-label="Open navigation menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {currentLabel}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {user?.organization_name || "Your workspace"}
            </Typography>
          </Box>
          <NotificationBell />
          <Tooltip title="My profile">
            <IconButton
              component={RouterLink}
              to="/profile"
              aria-label="Open my profile"
              sx={{ ml: 0.5 }}
            >
              <Avatar
                src={user?.profile_photo_url ?? undefined}
                alt={
                  user?.first_name
                    ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                    : "Profile photo"
                }
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: "primary.light",
                  color: "primary.dark",
                  fontSize: 12,
                  fontWeight: 750,
                }}
              >
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>
          {isMobile ? null : (
            <Button
              color="inherit"
              size="small"
              startIcon={<LogoutOutlinedIcon />}
              onClick={handleLogout}
              sx={{ ml: 0.5 }}
            >
              Sign out
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{ ml: { md: `${drawerWidth}px` }, minWidth: 0 }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1500,
            mx: "auto",
            px: { xs: 2, sm: 3, xl: 4 },
            py: { xs: 2.5, md: 3.5 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
