import { VirtualFileSystem } from './fileSystem';
import { generateTerminalResponse } from './geminiService';

// --- UTILS ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class SimulatedShell {
  fs: VirtualFileSystem;
  localIp: string;

  constructor(fs: VirtualFileSystem) {
    this.fs = fs;
    this.localIp = '192.168.1.14';
  }

  // --- CORE EXECUTION ENGINE ---
  async *execute(input: string): AsyncGenerator<string> {
    const trimmed = input.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    // --- 1. FILESYSTEM & CORE (Local & Fast) ---
    switch (cmd) {
        case 'clear':
            yield 'CLEAR_SIGNAL';
            return;
        case 'ls':
            yield this.fs.ls(args[0]);
            return;
        case 'cd':
            yield this.fs.cd(args[0]);
            return;
        case 'pwd':
            yield this.fs.pwd();
            return;
        case 'whoami':
            yield 'root';
            return;
        case 'cat':
            if (!args[0]) { yield 'cat: missing file operand'; return; }
            const content = this.fs.readFile(args[0]);
            if (content !== null) yield content;
            else yield `cat: ${args[0]}: No such file or directory`;
            return;
        case 'echo':
            const text = args.join(' ').replace(/['"]/g, '');
            if (args.includes('>') && args.length >= 3) {
                 const arrowIndex = args.indexOf('>');
                 const contentToWrite = args.slice(0, arrowIndex).join(' ').replace(/['"]/g, '');
                 const fileName = args[arrowIndex + 1];
                 this.fs.writeFile(this.fs.current, fileName, contentToWrite);
                 return;
            }
            yield text;
            return;
        case 'mkdir':
            if (!args[0]) { yield 'mkdir: missing operand'; return; }
            this.fs.mkdir(this.fs.current, args[0]);
            return;
        case 'touch':
            if (!args[0]) { yield 'touch: missing file operand'; return; }
            this.fs.writeFile(this.fs.current, args[0], '');
            return;
        case 'rm':
            if (!args[0]) { yield 'rm: missing operand'; return; }
            const res = this.fs.rm(args[0]);
            if (res) yield res;
            return;
        case 'help':
            yield "GNU bash, version 5.1.16(1)-release (x86_64-kali-linux-gnu)";
            yield "Core Commands: ls, cd, pwd, cat, echo, mkdir, rm, clear";
            yield "Real Network : curl, wget";
            yield "Hardware     : camshot, geoloc, arecord";
            yield "AI Kernel    : nmap, whois, python3, ssh, git, etc.";
            return;
    }

    // --- 2. REAL HARDWARE ACCESS ---
    if (cmd === 'camshot') {
        yield "[*] Initializing /dev/video0...";
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            yield "[+] Camera device found and mounted.";
            await delay(500);
            yield "[*] Capturing frame...";
            const fileName = `capture_${Date.now()}.jpg`;
            this.fs.writeFile(this.fs.current, fileName, '[Binary Image Data]');
            yield `[+] Image saved to ${this.fs.pwd()}/${fileName}`;
        } catch (e) {
            yield "[-] Error: Could not access camera device. Permission denied.";
        }
        return;
    }

    if (cmd === 'arecord') {
        yield "[*] Accessing /dev/audio...";
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            yield "[+] Microphone initialized. Recording...";
            await delay(2000);
            yield "[*] Recording stopped (2s buffer limit).";
            const fileName = `rec_${Date.now()}.wav`;
            this.fs.writeFile(this.fs.current, fileName, '[Binary Audio Data]');
            yield `[+] Audio saved to ${fileName}`;
        } catch (e) {
            yield "[-] Error: Could not access microphone.";
        }
        return;
    }

    if (cmd === 'geoloc') {
        yield "[*] Connecting to GNSS satellites...";
        try {
             const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                 navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
             });
             yield `[+] FIX ACQUIRED: 3D`;
             yield `    LAT:  ${pos.coords.latitude.toFixed(6)}`;
             yield `    LONG: ${pos.coords.longitude.toFixed(6)}`;
             yield `    ALT:  ${pos.coords.altitude || 0}m`;
        } catch (e) {
             yield "[-] Error: GPS signal lost or permission denied.";
        }
        return;
    }

    // --- 3. REAL NETWORK TOOLS (FETCH) ---
    if (cmd === 'curl' || cmd === 'wget') {
        const url = args[0];
        if (!url) { yield `${cmd}: missing URL`; return; }
        
        yield `[*] Requesting ${url}...`;
        try {
            // Attempt real fetch (will fail on CORS for many sites, but works for some APIs or same-origin)
            // Using a CORS proxy is standard for web-terminals, but here we try direct first or fall back to simulated message.
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);
            
            const res = await fetch(url, { signal: controller.signal, mode: 'no-cors' }); // no-cors allow opaque response
            clearTimeout(id);
            
            yield `[+] HTTP 200 OK`;
            yield `    Content-Type: ${res.headers.get('content-type') || 'text/html'}`;
            yield `    Size: unknown (opaque)`;
            yield ``;
            yield `[Preview Mode - Binary Content Hidden]`;
        } catch (e) {
            yield `[-] Connection failed: ${(e as Error).message}`;
            yield `    (Note: CORS restrictions apply in browser environment)`;
        }
        return;
    }

    // --- 4. PRE-CANNED ANIMATIONS (For specific Hacker Tools) ---
    // These are too complex to generate purely via text stream effectively, so we keep the high-quality animation
    if (cmd === 'wifite') {
        yield "   .               .    ";
        yield " .´  ·  .     .  ·  .  ";
        yield " :  :  :  (¯)  :  :  : ";
        yield " .  ·  .  ' '  .  ·  . ";
        yield "   '   '   wifite   '   ' ";
        yield "";
        yield " [!] wifite needs to be run as root"; 
        await delay(200);
        yield ` [+] enabling monitor mode on wlan0... done`;
        yield " [+] scanning for wireless devices...";
        await delay(1500);
        yield "  NUM  ESSID              CH  ENCR  POWER  WPS?  CLIENT";
        yield "  ---  -----------------  --  ----  -----  ----  ------";
        yield "   1   SKYNET_GUEST        1  WPA2  45db   no    2";
        yield "   2   Corp_Wifi           6  OPEN  70db   no    5";
        yield "";
        return;
    }

    if (cmd === 'cmatrix') {
        yield "\x1b[1;32m"; // Green
        for(let i=0; i<30; i++) {
            let line = "";
            for(let j=0; j<40; j++) line += String.fromCharCode(0x30A0 + Math.random() * 96) + " ";
            yield line;
            await delay(50);
        }
        yield "\x1b[0m"; // Reset
        return;
    }

    // --- 5. AI KERNEL FALLBACK (Nmap, Python, SSH, etc.) ---
    // This makes "any" command work by interpreting it via the LLM.
    
    // Check if it looks like a binary we claim to have
    const knownTools = ['nmap', 'python', 'python3', 'ssh', 'git', 'whois', 'dig', 'nslookup', 'gcc', 'make', 'service', 'systemctl', 'apt', 'apt-get'];
    if (knownTools.includes(cmd) || this.fs.resolvePath(`/usr/bin/${cmd}`)) {
        yield `[*] Executing ${cmd} (via Kernel)...`;
        const fsContext = `Current Dir: ${this.fs.pwd()}\nFiles: ${Object.keys(this.fs.current.children || {}).join(', ')}`;
        
        try {
            // Pass to Gemini to generate realistic command output
            const response = await generateTerminalResponse("", input, fsContext);
            const lines = response.split('\n');
            for (const line of lines) {
                yield line;
                // Add tiny delay for "typing" feel on long outputs
                if (lines.length > 5) await delay(10); 
            }
        } catch (e) {
            yield `bash: ${cmd}: command failed (Resource Limit)`;
        }
        return;
    }

    yield `bash: ${cmd}: command not found`;
  }
}