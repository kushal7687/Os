import { Terminal, Settings, Cloud, Search, FileText, Music, Gamepad2, Mic, Globe, Box, Instagram, Facebook, Mail, Youtube, Radio } from 'lucide-react';

export const DEFAULT_WALLPAPER = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop";

export const WALLPAPERS = [
  // Space
  { name: "Deep Nebula", category: "Space", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1920&auto=format&fit=crop" },
  { name: "Orbit", category: "Space", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop" },
  { name: "Mars", category: "Space", url: "https://images.unsplash.com/photo-1614728853975-69c960c7274e?q=80&w=1920&auto=format&fit=crop" },
  
  // Nature
  { name: "Misty Mountains", category: "Nature", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1920&auto=format&fit=crop" },
  { name: "Forest Path", category: "Nature", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1920&auto=format&fit=crop" },
  { name: "Ocean Waves", category: "Nature", url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1920&auto=format&fit=crop" },
  { name: "Winter", category: "Nature", url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1920&auto=format&fit=crop" },

  // Urban
  { name: "Tokyo Night", category: "Urban", url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1920&auto=format&fit=crop" },
  { name: "City Rain", category: "Urban", url: "https://images.unsplash.com/photo-1515587630240-b965fa672078?q=80&w=1920&auto=format&fit=crop" },
  { name: "Skyscrapers", category: "Urban", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1920&auto=format&fit=crop" },

  // Abstract
  { name: "Fluid", category: "Abstract", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1920&auto=format&fit=crop" },
  { name: "Geometry", category: "Abstract", url: "https://images.unsplash.com/photo-1550684848-86a5d8727436?q=80&w=1920&auto=format&fit=crop" },
  { name: "Neon Curves", category: "Abstract", url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1920&auto=format&fit=crop" },

  // Minimal
  { name: "White Desk", category: "Minimal", url: "https://images.unsplash.com/photo-1493723843689-ce20b3684a28?q=80&w=1920&auto=format&fit=crop" },
  { name: "Dark Gradient", category: "Minimal", url: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1920&auto=format&fit=crop" },
  
  // Tech / Cyberpunk
  { name: "Server Room", category: "Tech", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1920&auto=format&fit=crop" },
  { name: "Code", category: "Tech", url: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=1920&auto=format&fit=crop" },
  { name: "Cyberpunk City", category: "Tech", url: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=1920&auto=format&fit=crop" },
];

// App IDs
export const APP_IDS = {
  TERMINAL: 'terminal',
  SETTINGS: 'settings',
  STORE: 'store',
  ASSISTANT: 'assistant',
  FILES: 'files',
  BROWSER: 'browser',
  RADIO: 'radio',
  MONITOR: 'monitor',
  MEDIA: 'media',
  GAME: 'game',
  // Social & Web Apps
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  GMAIL: 'gmail',
  YOUTUBE: 'youtube',
  SPOTIFY: 'spotify'
};

export const SYSTEM_NAME = "CloudOS";
export const SYSTEM_VERSION = "v2.2.0-custom";