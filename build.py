import os
import re

# ================= K O N F I G U R A S I   V A R I A N =================

# 1. Definisi File per Kategori
FILES_OEM_TRACKER = [
    "filters/smartphone-tracking/tracking-xiaomi.txt",
    "filters/smartphone-tracking/tracking-amazon.txt",
    "filters/smartphone-tracking/tracking-apple.txt",
    "filters/smartphone-tracking/tracking-oppo-realme.txt",
    "filters/smartphone-tracking/tracking-vivo.txt",
    "filters/smartphone-tracking/tracking-huawei.txt",
    "filters/smartphone-tracking/tracking-samsung.txt",
]

FILES_SPECIFIC = [
    "filters/blocklist/RifqyShield-BlockList.txt",
    "filters/blocklist/RifqyShield-Anti-PopUP.txt",
    "filters/youtube-ads/youtube-ads.txt",
    "filters/blocklist/Hagezi-PopUpAds.txt",
    "filters/youtube-ads/youtube-ads2.txt",
    "filters/blocklist/Hagezi-Urlshortener.txt",
    "filters/spotify-ads/spotify-ads.txt",
    "filters/spotify-ads/spotify-ads2.txt",
]

FILES_NSFW_GAMBLING = [
    "filters/nsfw/nsfw.txt",
    "filters/nsfw/nsfw-2.txt",
    "filters/nsfw/nsfw-3.txt",
    "filters/nsfw/OISD-NSFW.txt",
    "filters/nsfw/Hagezi-NSFW.txt",
    "filters/gambling/gambling.txt",
    "filters/gambling/Hagezi-Gambling.txt",
    "filters/gambling/gambling-2.txt",
    "filters/gambling/gambling-4.txt",
    "filters/gambling/gambling-3.txt",
]

FILES_BIG_DATA = [
    "filters/blocklist/blocklist.txt", 
    "filters/blocklist/ultimate.txt",
    "filters/blocklist/OISD-BIG.txt",
]

# 2. Definisi Varian
VARIANTS = {
    "lite": FILES_OEM_TRACKER + FILES_SPECIFIC,
    "medium": FILES_OEM_TRACKER + FILES_SPECIFIC + FILES_NSFW_GAMBLING,
    "ultimate": FILES_OEM_TRACKER + FILES_SPECIFIC + FILES_NSFW_GAMBLING + FILES_BIG_DATA
}

BASE_OUTPUT_DIR = 'output'

# ================= L O G I K A   S C R I P T =================

def clean_domain(line):
    """
    Membersihkan baris menjadi domain murni.
    Hanya membuang komentar dan kata CNAME.
    """
    # 1. Hapus komentar (# atau !)
    line = line.split('#')[0].split('!')[0].strip()
    
    # 2. Hapus kata CNAME saja
    if ' CNAME' in line:
        line = line.split(' CNAME')[0].strip()

    if not line:
        return None

    # 3. Pembersihan standar
    line = line.replace('127.0.0.1', '').replace('0.0.0.0', '')
    line = line.replace('||', '').replace('^', '').replace('*.', '')
    
    domain = line.strip().lower()

    # 4. Validasi akhir
    if '.' in domain and ' ' not in domain and len(domain) > 3:
        return domain
    
    return None

def write_files(variant_name, domains):
    target_dir = os.path.join(BASE_OUTPUT_DIR, variant_name)
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    sorted_domains = sorted(list(domains))
    total_count = len(sorted_domains)
    
    print(f"  [{variant_name.upper()}] Menulis {total_count} domain...")

    # Output Hosts
    with open(os.path.join(target_dir, 'hosts.txt'), 'w', encoding='utf-8') as f:
        f.write(f"# RifqyShield {variant_name.capitalize()} List\n# Total: {total_count}\n\n")
        for domain in sorted_domains:
            f.write(f"0.0.0.0 {domain}\n")

    # Output Adblock
    with open(os.path.join(target_dir, 'adblock.txt'), 'w', encoding='utf-8') as f:
        f.write(f"! RifqyShield {variant_name.capitalize()} List\n\n")
        for domain in sorted_domains:
            f.write(f"||{domain}^\n")

    # Output Wildcard
    with open(os.path.join(target_dir, 'wildcard.txt'), 'w', encoding='utf-8') as f:
        f.write(f"# RifqyShield {variant_name.capitalize()} Wildcard\n\n")
        for domain in sorted_domains:
            f.write(f"*.{domain}\n")

    # Output Plain
    with open(os.path.join(target_dir, 'plain.txt'), 'w', encoding='utf-8') as f:
        for domain in sorted_domains:
            f.write(f"{domain}\n")

def main():
    print("--- MEMULAI PROSES BUILD MULTI-VARIAN ---")
    for variant_name, file_list in VARIANTS.items():
        print(f"\nMemproses Varian: {variant_name.upper()}")
        unique_domains = set()
        for file_path in file_list:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        for line in f:
                            clean = clean_domain(line)
                            if clean:
                                unique_domains.add(clean)
                except Exception as e:
                    print(f"  [ERROR] {file_path}: {e}")
        write_files(variant_name, unique_domains)
    print("\n--- SEMUA SELESAI ---")

if __name__ == "__main__":
    main()
    
