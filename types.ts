import React from 'react';

export interface AppDefinition {
  id: string;
  name: string;
  icon: any; 
  color: string;
  component: any; // Explicitly set to 'any' to allow components with different Prop requirements (e.g. SettingsApp vs TerminalApp)
  isSystem?: boolean; 
  defaultUrl?: string;
  [key: string]: any; // Index signature to allow extra properties
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
  id: string; 
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
  iconSize: 'small' | 'medium' | 'large';
  gridDensity: 'compact' | 'comfortable';
  glassIntensity: 'low' | 'medium' | 'high';
  dockPosition: 'bottom' | 'left' | 'right';
  dockBehavior: 'always' | 'intelligent' | 'hidden';
}

export interface FileSystemNode {
  name: string;
  type: 'file' | 'dir';
  content?: string;
  children?: { [key: string]: FileSystemNode };
  parent?: FileSystemNode; 
}