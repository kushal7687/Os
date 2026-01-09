import React from 'react';

export interface AppDefinition {
  id: string;
  name: string;
  icon: any; // Relaxed to 'any' to prevent Lucide version mismatches
  color: string;
  component: any; // Relaxed to 'any' to accept components with varying props (like SettingsApp)
  isSystem?: boolean; 
  defaultUrl?: string;
  [key: string]: any; // Index signature: Allow any other extra properties to prevent strict errors
}

export interface AppProps {
  appId: string;
  onClose: () => void;
  isFocused: boolean;
  isComputerMode?: boolean;
  isHackerMode?: boolean; 
  args?: any;
}

export interface WindowState {
  id: string; // appId
  zIndex: number;
  minimized: boolean;
  position?: { x: number; y: number };
  size?: { w: number; h: number };
}

export interface SystemSettings {
  wallpaper: string;
  darkMode: boolean;
  accentColor: string;
  userName: string;
  hostname: string;
  isComputerMode: boolean;
  themeMode: 'default' | 'hacker'; 
  // Home Screen
  iconSize: 'small' | 'medium' | 'large';
  gridDensity: 'compact' | 'comfortable';
  glassIntensity: 'low' | 'medium' | 'high';
  // Dock / Taskbar
  dockPosition: 'bottom' | 'left' | 'right';
  dockBehavior: 'always' | 'intelligent' | 'hidden';
}

export interface FileSystemNode {
  name: string;
  type: 'file' | 'dir';
  content?: string;
  children?: { [key: string]: FileSystemNode };
  parent?: FileSystemNode; // Reference for traversal
}