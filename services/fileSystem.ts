import { FileSystemNode } from '../types';

export class VirtualFileSystem {
  root: FileSystemNode;
  current: FileSystemNode;
  user: string;

  constructor(user: string = 'user') {
    this.user = user;
    
    // Initialize Root
    this.root = {
      name: '/',
      type: 'dir',
      children: {}
    };

    // Initialize Standard Directories
    this.mkdir(this.root, 'home');
    this.mkdir(this.root, 'bin');
    this.mkdir(this.root, 'etc');
    this.mkdir(this.root, 'var');

    // User Home
    const home = this.root.children!['home'];
    this.mkdir(home, user);
    
    // Set CWD to ~
    this.current = home.children![user];
    
    // Add some default files
    this.touch(this.current, 'welcome.txt', 'Welcome to CloudOS Mobile!\nThis is a simulated Linux environment.');
    this.touch(this.current, 'todo.list', '- Install apps\n- Check email\n- Conquer the cloud');
  }

  mkdir(parent: FileSystemNode, name: string): FileSystemNode {
    if (!parent.children) parent.children = {};
    const newDir: FileSystemNode = {
      name,
      type: 'dir',
      children: {},
      parent: parent
    };
    parent.children[name] = newDir;
    return newDir;
  }

  touch(parent: FileSystemNode, name: string, content: string = ''): FileSystemNode {
    if (!parent.children) parent.children = {};
    const newFile: FileSystemNode = {
      name,
      type: 'file',
      content,
      parent: parent
    };
    parent.children[name] = newFile;
    return newFile;
  }

  cd(path: string): string {
    if (path === '/' || path === '') {
      this.current = this.root;
      return '';
    }
    if (path === '..') {
      if (this.current.parent) {
        this.current = this.current.parent;
      }
      return '';
    }
    if (path === '~') {
        const home = this.root.children?.['home']?.children?.[this.user];
        if (home) this.current = home;
        return '';
    }

    const target = this.current.children?.[path];
    if (target && target.type === 'dir') {
      this.current = target;
      return '';
    } else {
      return `cd: no such file or directory: ${path}`;
    }
  }

  ls(): string {
    if (!this.current.children) return '';
    const items = Object.values(this.current.children).map(node => {
        return node.type === 'dir' ? `\x1b[1;34m${node.name}/\x1b[0m` : node.name;
    });
    return items.join('  ');
  }

  pwd(): string {
    let path = '';
    let node = this.current;
    while (node.parent) {
      path = '/' + node.name + path;
      node = node.parent;
    }
    return path || '/';
  }

  cat(filename: string): string {
    const file = this.current.children?.[filename];
    if (file && file.type === 'file') {
      return file.content || '';
    }
    return `cat: ${filename}: No such file`;
  }

  // Helper to resolve paths like /etc/hosts (simplified)
  resolve(path: string): FileSystemNode | null {
      // Not implemented for this demo, assumes relative paths usually
      return null;
  }
}

// Singleton instance
export const fs = new VirtualFileSystem();