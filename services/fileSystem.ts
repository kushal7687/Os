import { FileSystemNode } from '../types';

export class VirtualFileSystem {
  root: FileSystemNode;
  current: FileSystemNode;
  user: string;

  constructor(user: string = 'root') {
    this.user = user;
    
    // Initialize Root
    this.root = {
      name: '/',
      type: 'dir',
      children: {}
    };

    // --- Build Standard Linux Hierarchy ---
    const bin = this.mkdir(this.root, 'bin');
    const etc = this.mkdir(this.root, 'etc');
    const home = this.mkdir(this.root, 'home');
    const rootHome = this.mkdir(this.root, 'root');
    const tmp = this.mkdir(this.root, 'tmp');
    const usr = this.mkdir(this.root, 'usr');
    const varDir = this.mkdir(this.root, 'var');

    // /usr/share/wordlists (Kali Standard)
    const share = this.mkdir(usr, 'share');
    const wordlists = this.mkdir(share, 'wordlists');
    this.writeFile(wordlists, 'rockyou.txt', '123456\npassword\nadmin\n12345678\nroot\n...(14 million entries)...');

    // /etc/passwd
    this.writeFile(etc, 'passwd', 'root:x:0:0:root:/root:/bin/zsh\nuser:x:1000:1000:user:/home/user:/bin/zsh');

    // /etc/os-release
    this.writeFile(etc, 'os-release', 'PRETTY_NAME="Kali GNU/Linux Rolling"\nNAME="Kali GNU/Linux"\nID=kali\nVERSION="2024.1"\nID_LIKE=debian');

    // /root/
    this.writeFile(rootHome, 'welcome.msg', 'Welcome to the Neural Kernel.\nAll systems operational.');
    this.writeFile(rootHome, 'todo.txt', '- Update metasploit\n- Scan target 192.168.1.55\n- Write payload.py');

    // Set CWD to /root
    this.current = rootHome;
  }

  // --- Core Operations ---

  resolvePath(path: string): FileSystemNode | null {
    if (!path) return this.current;
    if (path === '/') return this.root;
    if (path === '~') return this.root.children!['root'];

    let node = path.startsWith('/') ? this.root : this.current;
    const parts = path.split('/').filter(Boolean);

    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (node.parent) node = node.parent;
        continue;
      }
      if (node.children && node.children[part]) {
        node = node.children[part];
      } else {
        return null;
      }
    }
    return node;
  }

  mkdir(parent: FileSystemNode, name: string): FileSystemNode {
    if (!parent.children) parent.children = {};
    if (parent.children[name]) return parent.children[name];
    
    const newDir: FileSystemNode = {
      name,
      type: 'dir',
      children: {},
      parent: parent
    };
    parent.children[name] = newDir;
    return newDir;
  }

  writeFile(parent: FileSystemNode, name: string, content: string): FileSystemNode {
    if (!parent.children) parent.children = {};
    // Overwrite if exists
    if (parent.children[name]) {
        parent.children[name].content = content;
        return parent.children[name];
    }
    
    const newFile: FileSystemNode = {
      name,
      type: 'file',
      content,
      parent: parent
    };
    parent.children[name] = newFile;
    return newFile;
  }

  readFile(path: string): string | null {
    const node = this.resolvePath(path);
    if (node && node.type === 'file') {
        return node.content || '';
    }
    // Try resolving as child of current if simple name
    if (this.current.children && this.current.children[path] && this.current.children[path].type === 'file') {
        return this.current.children[path].content || '';
    }
    return null;
  }

  rm(path: string): string {
    const target = this.resolvePath(path);
    if (!target) return `rm: cannot remove '${path}': No such file or directory`;
    
    // Cannot delete root
    if (target === this.root) return `rm: cannot remove root directory`;

    if (target.parent && target.parent.children) {
        delete target.parent.children[target.name];
        return '';
    }
    return 'rm: unknown error';
  }

  // --- Shell Commands Support ---

  cd(path: string): string {
    if (!path || path === '~') {
        const home = this.root.children!['root'];
        this.current = home;
        return '';
    }
    
    const target = this.resolvePath(path);
    if (target && target.type === 'dir') {
      this.current = target;
      return '';
    }
    return `cd: no such file or directory: ${path}`;
  }

  ls(flags: string = ''): string {
    if (!this.current.children) return '';
    const items = Object.values(this.current.children);
    
    if (items.length === 0) return '';

    return items.map(node => {
        let color = '\x1b[0m'; // Default white
        if (node.type === 'dir') color = '\x1b[1;34m'; // Blue Bold
        else if (node.name.endsWith('.sh') || node.name.endsWith('.py') || node.name.endsWith('.pl')) color = '\x1b[1;32m'; // Green Bold
        else if (node.name.endsWith('.zip') || node.name.endsWith('.tar.gz')) color = '\x1b[1;31m'; // Red Bold
        
        return `${color}${node.name}\x1b[0m`;
    }).join('  ');
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

  // Generate context for AI execution
  getAIContext(): string {
      const files = this.current.children ? Object.keys(this.current.children) : [];
      let context = `Current User: root\nCurrent Directory: ${this.pwd()}\nDirectory Contents: ${JSON.stringify(files)}\n`;
      
      // If there are scripts in the directory, feed their content to AI so it can "run" them
      files.forEach(f => {
          const node = this.current.children![f];
          if (node.type === 'file' && (f.endsWith('.py') || f.endsWith('.sh') || f.endsWith('.txt'))) {
              context += `\n[FILE START: ${f}]\n${node.content}\n[FILE END: ${f}]\n`;
          }
      });

      return context;
  }
}

// Global Singleton
export const fs = new VirtualFileSystem();