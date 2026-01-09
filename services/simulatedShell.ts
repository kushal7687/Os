import { VirtualFileSystem } from './fileSystem';

// Helper for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Random IP generator for simulations
const randomIP = () => `192.168.1.${Math.floor(Math.random() * 254) + 1}`;

export class SimulatedShell {
  fs: VirtualFileSystem;

  constructor(fs: VirtualFileSystem) {
    this.fs = fs;
  }

  // Main entry point: returns an async generator yielding lines of output
  async *execute(input: string): AsyncGenerator<string> {
    const trimmed = input.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // --- Core Utils ---
    if (cmd === 'clear') {
       yield 'CLEAR_SIGNAL'; // Handled by UI
       return;
    }
    if (cmd === 'help') {
        yield "GNU bash, version 5.1.16(1)-release (x86_64-pc-linux-gnu)";
        yield "These shell commands are defined internally.  Type 'help' to see this list.";
        yield "";
        yield "Core:     ls, cd, pwd, cat, echo, mkdir, rm, touch, whoami, date, history, clear";
        yield "Network:  ip, ifconfig, ping, netstat";
        yield "Hacking:  nmap, hydra, sqlmap, msfconsole, wifite, aircrack-ng, john";
        yield "System:   uname, neofetch, apt, sudo, reboot, shutdown";
        return;
    }
    if (cmd === 'ls') {
        yield this.fs.ls(args[0]);
        return;
    }
    if (cmd === 'cd') {
        yield this.fs.cd(args[0]);
        return;
    }
    if (cmd === 'pwd') {
        yield this.fs.pwd();
        return;
    }
    if (cmd === 'cat') {
        const content = this.fs.readFile(args[0]);
        yield content || `cat: ${args[0]}: No such file or directory`;
        return;
    }
    if (cmd === 'echo') {
        yield args.join(' ');
        return;
    }
    if (cmd === 'mkdir') {
        this.fs.mkdir(this.fs.current, args[0]);
        return;
    }
    if (cmd === 'rm') {
        yield this.fs.rm(args[0]);
        return;
    }
    if (cmd === 'whoami') {
        yield "root";
        return;
    }
    if (cmd === 'date') {
        yield new Date().toString();
        return;
    }
    if (cmd === 'uname') {
        if (args.includes('-a')) yield "Linux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 (2024-01-08) x86_64 GNU/Linux";
        else yield "Linux";
        return;
    }
    if (cmd === 'sudo') {
        if (args.length === 0) {
             yield "usage: sudo -h | -K | -k | -V";
             yield "usage: sudo -v [-AknS] [-g group] [-h host] [-p prompt] [-u user]";
             return;
        }
        // Recursive call for sudo (simulated as already root)
        yield* this.execute(args.join(' '));
        return;
    }

    // --- Network Tools ---
    if (cmd === 'ping') {
        const target = args[0] || '8.8.8.8';
        yield `PING ${target} (${target}) 56(84) bytes of data.`;
        for (let i = 0; i < 4; i++) {
            await delay(800);
            yield `64 bytes from ${target}: icmp_seq=${i+1} ttl=115 time=${(Math.random() * 20 + 10).toFixed(1)} ms`;
        }
        yield `--- ${target} ping statistics ---`;
        yield `4 packets transmitted, 4 received, 0% packet loss, time 3004ms`;
        return;
    }

    if (cmd === 'ifconfig' || cmd === 'ip') {
        yield "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500";
        yield "        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255";
        yield "        ether 08:00:27:1c:4a:22  txqueuelen 1000  (Ethernet)";
        yield "        RX packets 152  bytes 45210 (44.1 KiB)";
        yield "        TX packets 104  bytes 12450 (12.1 KiB)";
        yield "";
        yield "lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536";
        yield "        inet 127.0.0.1  netmask 255.0.0.0";
        yield "        loop  txqueuelen 1000  (Local Loopback)";
        return;
    }

    // --- Hacking Tools ---

    if (cmd === 'nmap') {
        const target = args[0] || randomIP();
        yield `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleTimeString()}`;
        await delay(500);
        yield `Nmap scan report for ${target}`;
        yield "Host is up (0.0023s latency).";
        await delay(1000);
        yield "Not shown: 997 closed tcp ports (reset)";
        yield "PORT     STATE SERVICE";
        yield "21/tcp   open  ftp";
        yield "22/tcp   open  ssh";
        yield "80/tcp   open  http";
        await delay(500);
        yield "";
        yield `Nmap done: 1 IP address (1 host up) scanned in 1.45 seconds`;
        return;
    }

    if (cmd === 'hydra') {
        if (args.length < 2) {
            yield "Hydra v9.5 (c) 2023 by van Hauser/THC - Please supply a target and service.";
            yield "Syntax: hydra -l user -P passlist.txt <target> <service>";
            return;
        }
        yield "Hydra v9.5 (c) 2023 by van Hauser/THC - Starting hydra (http://www.thc.org/thc-hydra)";
        yield `[DATA] max 16 tasks per 1 server, overall 16 tasks, 1 login try (l:1/p:1), ~16 tries per task`;
        yield `[DATA] attacking ${args[args.length-1]}://192.168.1.55:22/`;
        await delay(1000);
        yield "[Attempt] login: admin   pass: 123456";
        await delay(500);
        yield "[Attempt] login: admin   pass: password";
        await delay(500);
        yield "[Attempt] login: root    pass: toor";
        await delay(800);
        yield `[22][ssh] host: 192.168.1.55   login: root   password: toor`;
        yield "1 of 1 target successfully completed, 1 valid password found";
        return;
    }

    if (cmd === 'sqlmap') {
        yield "        ___";
        yield "       __H__";
        yield " ___ ___[.]_____ ___ ___  {1.7.2#stable}";
        yield "|_ -| . [,]     | .'| . |";
        yield "|___|_  [.]_|_|_|__,|  _|";
        yield "      |_|V...       |_|   http://sqlmap.org";
        yield "";
        yield "[*] starting at " + new Date().toLocaleTimeString();
        await delay(500);
        yield "[*] testing connection to the target URL";
        yield "[*] checking if the target is protected by some WAF/IPS";
        await delay(800);
        yield "[*] testing for SQL injection";
        yield "[*] testing 'AND boolean-based blind - WHERE or HAVING clause'";
        await delay(1200);
        yield "[+] parameter 'id' appears to be 'MySQL > 5.0.12' injectable";
        yield "[*] fetching current database";
        yield "current database: 'production_db'";
        yield "[*] fetched data logged to text files under '/root/.local/share/sqlmap/output/'";
        return;
    }

    if (cmd === 'wifite') {
        yield "   .               .    ";
        yield " .´  ·  .     .  ·  .  ";
        yield " :  :  :  (¯)  :  :  : ";
        yield " .  ·  .  ' '  .  ·  . ";
        yield "   '   '   wifite   '   ' ";
        yield "";
        yield "[+] scanning for wireless devices...";
        await delay(1000);
        yield "[+] found 1 wireless device(s)";
        yield "[+] enabling monitor mode on wlan0... done";
        yield "[+] scanning for targets (5s)...";
        await delay(2000);
        yield "  NUM  ESSID              CH  ENCR  POWER  WPS?  CLIENT";
        yield "  ---  -----------------  --  ----  -----  ----  ------";
        yield "   1   Home_WiFi_2G        1  WPA2  45db   no    2";
        yield "   2   Starbucks_Guest     6  OPEN  70db   no    12";
        yield "   3   NETGEAR-99         11  WPA2  20db   yes   0";
        yield "";
        yield "[+] select target(s) (1-3) or (all):";
        // Simple simulation ends here for the non-interactive version
        yield "[!] auto-selecting target 1 (Simulation Mode)";
        await delay(1000);
        yield "[+] capturing handshake... [OK]";
        yield "[+] cracking pcap with aircrack-ng...";
        await delay(1500);
        yield "[+] key found: 'summer2023'";
        return;
    }

    if (cmd === 'msfconsole') {
        yield "       =[ metasploit v6.3.55-dev                          ]";
        yield "+ -- --=[ 2392 exploits - 1235 auxiliary - 422 post       ]";
        yield "+ -- --=[ 1468 payloads - 47 encoders - 11 nops           ]";
        yield "+ -- --=[ 9 evasion                                       ]";
        yield "";
        yield "msf6 > search vsftpd";
        await delay(600);
        yield "Matching Modules";
        yield "================";
        yield "   #  Name                                  Disclosure Date  Rank       Check  Description";
        yield "   -  ----                                  ---------------  ----       -----  -----------";
        yield "   0  exploit/unix/ftp/vsftpd_234_backdoor  2011-07-03       excellent  No     VSFTPD v2.3.4 Backdoor Command Execution";
        yield "";
        yield "msf6 > use 0";
        yield "msf6 exploit(unix/ftp/vsftpd_234_backdoor) > set RHOSTS 192.168.1.55";
        yield "RHOSTS => 192.168.1.55";
        yield "msf6 exploit(unix/ftp/vsftpd_234_backdoor) > exploit";
        await delay(1000);
        yield "[*] 192.168.1.55:21 - Banner: 220 (vsFTPd 2.3.4)";
        yield "[+] 192.168.1.55:21 - Backdoor service has been spawned, handling...";
        yield "[*] Found shell.";
        yield "[*] Command shell session 1 opened (192.168.1.5:4444 -> 192.168.1.55:6200)";
        yield "uid=0(root) gid=0(root) groups=0(root)";
        return;
    }

    if (cmd === 'aircrack-ng') {
        if (!args[0]) {
            yield "No input file specified.";
            yield "usage: aircrack-ng <pcap file>";
            return;
        }
        yield "Opening " + args[0];
        yield "Read 458 packets.";
        yield "";
        yield "   #  BSSID              ESSID                     Encryption";
        yield "   1  00:14:6C:7E:40:80  Teddy                     WPA (1 handshake)";
        yield "";
        yield "Choosing first network as target.";
        yield "Reading wordlist: /usr/share/wordlists/rockyou.txt";
        await delay(500);
        yield "KEY FOUND! [ biscotti ]";
        yield "";
        yield "Master Key     : 6E 1A C3 ...";
        yield "Transient Key  : 4B 82 90 ...";
        yield "EAPOL HMAC     : 1F 22 33 ...";
        return;
    }

    if (cmd === 'apt' || cmd === 'apt-get') {
        const sub = args[0];
        if (sub === 'update') {
            yield "Hit:1 http://kali.download/kali kali-rolling InRelease";
            yield "Reading package lists... Done";
            yield "Building dependency tree... Done";
            return;
        }
        if (sub === 'upgrade' || sub === 'install') {
            yield "Reading package lists... Done";
            yield "Building dependency tree... Done";
            yield "Calculated upgrade... Done";
            yield "0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.";
            return;
        }
        yield "apt 2.7.14 (amd64)";
        return;
    }

    if (cmd === 'neofetch') {
        const art = [
            "       .       ",
            "      / \\      ",
            "     /   \\     ",
            "    /_____\\    ",
            "   /       \\   ",
            "  /_________\\  "
        ];
        const info = [
            "root@kali",
            "---------",
            "OS: Kali GNU/Linux Rolling x86_64",
            "Host: CloudOS Virtual Machine",
            "Kernel: 6.6.9-amd64",
            "Uptime: 2 mins",
            "Shell: zsh 5.9",
            "Memory: 1024MiB / 8192MiB"
        ];
        
        for (let i = 0; i < Math.max(art.length, info.length); i++) {
            const a = art[i] || "           ";
            const b = info[i] || "";
            yield `${a}  ${b}`;
        }
        return;
    }

    // Default fallback
    yield `bash: ${cmd}: command not found`;
  }
}