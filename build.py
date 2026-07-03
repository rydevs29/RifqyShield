import os
import re
import urllib.request
from datetime import datetime

# ================= K O N F I G U R A S I  V A R I A N =================

# 1. Definisi Sumber LOKAL (File buatan Anda di folder filters/)
# Note: Lokal Tracking dihapus sesuai instruksi.
LOCAL_NSFW_GAMBLING = [
    "filters/nsfw/RifqyShield-NSFW.txt",
    "filters/gambling/RifqyShield-Gambling.txt",
]

# 2. Definisi Sumber URL (Langsung download ke RAM, tanpa folder external)
URLS_LITE = [
    "https://raw.githubusercontent.com/sjhgvr/oisd/refs/heads/main/oisd_small.txt",
    "https://easylist.to/easylist/easyprivacy.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/native.amazon-onlydomains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/native.apple-onlydomains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/native.huawei-onlydomains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/native.lgwebos-onlydomains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/native.oppo-realme-onlydomains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/native.samsung-onlydomains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/native.vivo-onlydomains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/native.winoffice-onlydomains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/native.xiaomi-onlydomains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/native.tiktok.extended-onlydomains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/fake-onlydomains.txt",
]

URLS_MEDIUM = [
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/multi-onlydomains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/gambling.mini-onlydomains.txt",
    "https://raw.githubusercontent.com/StevenBlack/hosts/refs/heads/master/extensions/porn/bigdargon/hosts",
    "https://raw.githubusercontent.com/ABPindo/indonesianadblockrules/refs/heads/master/subscriptions/hosts.txt",
]

URLS_ULTIMATE = [
    "https://raw.githubusercontent.com/badmojr/1Hosts/refs/heads/master/Xtra/domains.txt",
    "https://raw.githubusercontent.com/hagezi/dns-blocklists/refs/heads/main/wildcard/ultimate.mini-onlydomains.txt",
]

# 3. Penggabungan Varian (Hybrid: Lokal + URL)
VARIANTS = {
    "lite": {
        "files": [], 
        "urls": URLS_LITE
    },
    "medium": {
        "files": LOCAL_NSFW_GAMBLING,
        "urls": URLS_LITE + URLS_MEDIUM
    },
    "ultimate": {
        "files": LOCAL_NSFW_GAMBLING,
        "urls": URLS_LITE + URLS_MEDIUM + URLS_ULTIMATE
    }
}

# ================= K O N F I G U R A S I  F O L D E R =================
BASE_OUTPUT_DIR = 'output'
WHITELIST_FILE = 'whitelist.txt'

# ================= E N G I N E  &  L O G I K A =================

def extract_domain(line):
    """Filter super ketat lapis ganda"""
    line = line.strip().lower()
    if not line or line.startswith(('!', '#', '[', '/', ':', ';', '@')): 
        return None
        
    line = line.split('#')[0].split('!')[0].split('//')[0].strip()
    domain_candidate = None

    if line.startswith('||'): domain_candidate = line[2:].split('^')[0].split('/')[0]
    elif line.startswith(('0.0.0.0', '127.0.0.1')):
        parts = line.split()
        if len(parts) >= 2: domain_candidate = parts[1]
    else:
        domain_candidate = line

    if domain_candidate:
        if re.match(r'^([a-z0-9][a-z0-9_-]*\.)+[a-z]{2,}$', domain_candidate):
            if not re.match(r'^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$', domain_candidate):
                return domain_candidate
    return None

def load_whitelist():
    """Membaca domain dari whitelist.txt untuk dipisahkan nanti"""
    whitelist = set()
    if os.path.exists(WHITELIST_FILE):
        with open(WHITELIST_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                domain = extract_domain(line)
                if domain: whitelist.add(domain)
        print(f"[*] Whitelist aktif: {len(whitelist)} domain akan dibebaskan.")
    else:
        print(f"[!] File {WHITELIST_FILE} tidak ditemukan. Berjalan tanpa whitelist.")
    return whitelist

def process_source(source_list, is_url=False):
    """Mengekstrak domain dari File Lokal atau URL"""
    extracted = set()
    for item in source_list:
        try:
            if is_url:
                print(f"    -> Mendownload: {item.split('/')[-1]}")
                req = urllib.request.Request(item, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=15) as response:
                    content = response.read().decode('utf-8')
                    for line in content.splitlines():
                        d = extract_domain(line)
                        if d: extracted.add(d)
            else:
                if os.path.exists(item):
                    print(f"    -> Membaca Lokal: {item}")
                    with open(item, 'r', encoding='utf-8', errors='ignore') as f:
                        for line in f:
                            d = extract_domain(line)
                            if d: extracted.add(d)
        except Exception as e:
            print(f"    [x] Gagal memproses {item}: {e}")
    return extracted

def write_files(variant_name, domains_list):
    """Mencetak 13 format file ke dalam folder varian"""
    target_dir = os.path.join(BASE_OUTPUT_DIR, variant_name)
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    total_count = len(domains_list)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    header_hash = f"# Title: RifqyShield {variant_name.capitalize()}\n# Last Updated: {now}\n# Total Domains: {total_count:,}\n# ==========================================\n"
    header_bang = f"! Title: RifqyShield {variant_name.capitalize()}\n! Last Updated: {now}\n! Total Domains: {total_count:,}\n! ==========================================\n"

    print(f"  [{variant_name.upper()}] Menyimpan {total_count:,} domain ke {target_dir}/...")

    # 1. Plain
    with open(os.path.join(target_dir, 'plain.txt'), 'w') as f: 
        f.write("\n".join(domains_list))
    
    # 2. Hosts
    with open(os.path.join(target_dir, 'hosts.txt'), 'w') as f:
        f.write(header_hash + "127.0.0.1 localhost\n::1 localhost\n")
        for d in domains_list: f.write(f"0.0.0.0 {d}\n")
    
    # 3. Adblock
    with open(os.path.join(target_dir, 'adblock.txt'), 'w') as f:
        f.write(header_bang)
        for d in domains_list: f.write(f"||{d}^\n")
    
    # 4. AdGuard Home
    with open(os.path.join(target_dir, 'adguard.txt'), 'w') as f:
        f.write(header_bang)
        for d in domains_list: f.write(f"||{d}^$important\n")
    
    # 5. DNSMasq
    with open(os.path.join(target_dir, 'dnsmasq.conf'), 'w') as f:
        f.write(header_hash)
        for d in domains_list: f.write(f"address=/{d}/0.0.0.0\n")
    
    # 6. MikroTik
    with open(os.path.join(target_dir, 'mikrotik.rsc'), 'w') as f:
        f.write(header_hash + "/ip dns static\n")
        for d in domains_list: f.write(f'add name="{d}" address=0.0.0.0\n')
    
    # 7. Unbound DNS
    with open(os.path.join(target_dir, 'unbound.conf'), 'w') as f:
        f.write(header_hash)
        for d in domains_list: f.write(f'local-zone: "{d}" always_nxdomain\n')
    
    # 8. BIND DNS
    with open(os.path.join(target_dir, 'bind.conf'), 'w') as f:
        f.write(header_hash.replace('#', '//'))
        for d in domains_list: f.write(f'zone "{d}" {{ type master; file "/etc/bind/db.empty"; }};\n')
    
    # 9. Surge
    with open(os.path.join(target_dir, 'surge.list'), 'w') as f:
        f.write(header_hash)
        for d in domains_list: f.write(f"DOMAIN-SUFFIX,{d},REJECT\n")
    
    # 10. Clash / Clash Meta
    with open(os.path.join(target_dir, 'clash.yaml'), 'w') as f:
        f.write(header_hash + "payload:\n")
        for d in domains_list: f.write(f"  - DOMAIN-SUFFIX,{d}\n")
    
    # 11. Quantumult X
    with open(os.path.join(target_dir, 'quantumultx.list'), 'w') as f:
        f.write(header_hash)
        for d in domains_list: f.write(f"HOST-SUFFIX,{d},reject\n")
    
    # 12. Loon
    with open(os.path.join(target_dir, 'loon.list'), 'w') as f:
        f.write(header_hash)
        for d in domains_list: f.write(f"DOMAIN-SUFFIX,{d},REJECT\n")
    
    # 13. Wildcard
    with open(os.path.join(target_dir, 'wildcard.txt'), 'w') as f:
        f.write(header_hash)
        for d in domains_list: f.write(f"*.{d}\n")

def main():
    print("="*50)
    print(" 🚀 RIFQYSHIELD ALL-IN-ONE ENGINE (LOCAL + CLOUD) ")
    print("="*50)

    # 1. Load Whitelist
    whitelist_domains = load_whitelist()

    # 2. Proses tiap Varian
    for variant_name, sources in VARIANTS.items():
        print(f"\n⚙️ MEMPROSES VARIAN: {variant_name.upper()}")
        
        variant_domains = set()
        
        # Ekstrak dari file lokal
        local_domains = process_source(sources["files"], is_url=False)
        variant_domains.update(local_domains)
        
        # Ekstrak dari URL cloud
        url_domains = process_source(sources["urls"], is_url=True)
        variant_domains.update(url_domains)

        # 3. ELIMINASI WHITELIST (Penting!)
        if whitelist_domains:
            variant_domains = variant_domains - whitelist_domains

        # Sortir dan cetak
        final_list = sorted(list(variant_domains))
        if final_list:
            write_files(variant_name, final_list)
        else:
            print(f"  [!] Tidak ada domain valid untuk varian {variant_name}.")

if __name__ == "__main__":
    main()
