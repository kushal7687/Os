import { Terminal, Settings, Cloud, Search, FileText, Music, Gamepad2, Mic, Globe, Box, Instagram, Facebook, Mail, Youtube, Radio, Activity } from 'lucide-react';

export const DEFAULT_WALLPAPER = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop";
export const HACKER_WALLPAPER = "https://i.pinimg.com/originals/f9/56/67/f9566774df355c707d8d2b992f33f443.gif"; // Reliable Matrix Rain GIF

export const WALLPAPERS = [
  // Hacker / Cyber
  { name: "Matrix Rain", category: "Hacker", url: "https://i.pinimg.com/originals/f9/56/67/f9566774df355c707d8d2b992f33f443.gif" },
  { name: "Red Code", category: "Hacker", url: "https://media.giphy.com/media/LeaD81pXn3rMc/giphy.gif" },
  { name: "Cyberpunk City", category: "Hacker", url: "https://i.pinimg.com/originals/e4/20/0e/e4200e572023cb36531980a37de56df2.gif" },
  { name: "Kali Dragon", category: "Hacker", url: "https://www.kali.org/images/notebook-kali-2022.2.jpg" },
  { name: "Terminal Green", category: "Hacker", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1920&auto=format&fit=crop" },

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
  GHOST: 'ghost',
  GAME: 'game',
  // Social & Web Apps
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  GMAIL: 'gmail',
  YOUTUBE: 'youtube',
  SPOTIFY: 'spotify'
};

export const SYSTEM_NAME = "CloudOS";
export const SYSTEM_VERSION = "v3.0.0-kali";