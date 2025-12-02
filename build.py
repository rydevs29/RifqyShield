import os
import re

# ================= K O N F I G U R A S I   V A R I A N =================

# 1. Definisi File per Kategori
FILES_OEM_TRACKER = [
    "filters/blocklist/ads-xiaomi.txt",
    "filters/blocklist/ads-oppo-realme.txt",
    "filters/blocklist/ads-vivo.txt",
    "filters/blocklist/ads-huawei.txt",
    "filters/blocklist/ads-samsung.txt",
]

FILES_SPECIFIC = [
    "filters/blocklist/RifqyShield-BlockList.txt",
    "filters/blocklist/google-ads.txt",
    "filters/youtube-ads/youtube-ads.txt",
    "filters/youtube-ads/youtube-ads2.txt",
    "filters/spotify-ads/spotify-ads.txt",
    "filters/spotify-ads/spotify-ads2.txt",
]

FILES_NSFW_GAMBLING = [
    "filters/nsfw/nsfw.txt",
    "filters/nsfw/nsfw-2.txt",
    "filters/nsfw/nsfw-3.txt",
    "filters/gambling/gambling.txt",
    "filters/gambling/gambling-2.txt",
    "filters/gambling/gambling-3.txt",
]

FILES_BIG_DATA = [
    "filters/blocklist/blocklist.txt", # Ini gabungan Hagezi + BlocklistProject
    "filters/blocklist/ultimate.txt",
    "filters/blocklist/oisd-big.txt",
]

# 2. Definisi Varian (Apa saja isi masing-masing level)
VARIANTS = {
    "lite": FILES_OEM_TRACKER + FILES_SPECIFIC,
    
    "medium": FILES_OEM_TRACKER + FILES_SPECIFIC + FILES_NSFW_GAMBLING,
    
    "ultimate": FILES_OEM_TRACKER + FILES_SPECIFIC + FILES_NSFW_GAMBLING + FILES_BIG_DATA
}

# Folder output utama
BASE_OUTPUT_DIR = 'output'

# ================= L O G I K A   S C R I P T =================

def clean_domain(line):
    """
    Membersihkan baris menjadi domain murni.
    """
    line = line.split('#')[0].split('!')[0].strip()
    if not line:
        return None

    line = line.replace('127.0.0.1', '').replace('0.0.0.0', '')
    line = line.replace('||', '').replace('^', '').replace('*.', '')
    
    domain = line.strip().lower()

    if '.' in domain and ' ' not in domain and len(domain) > 3:
        return domain
    
    return None

def write_files(variant_name, domains):
    """
    Fungsi untuk menulis file output (Hosts, Adblock, Wildcard, Plain)
    berdasarkan varian (lite/medium/ultimate)
    """
    # Buat folder khusus varian, misal: output/lite
    target_dir = os.path.join(BASE_OUTPUT_DIR, variant_name)
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    sorted_domains = sorted(list(domains))
    total_count = len(sorted_domains)
    
    print(f"  [{variant_name.upper()}] Menulis {total_count} domain ke folder {target_dir}...")

    # 1. HOSTS
    with open(os.path.join(target_dir, 'hosts.txt'), 'w', encoding='utf-8') as f:
        f.write(f"# RifqyShield {variant_name.capitalize()} List\n# Total Domains: {total_count}\n\n")
        for domain in sorted_domains:
            f.write(f"0.0.0.0 {domain}\n")

    # 2. ADBLOCK
    with open(os.path.join(target_dir, 'adblock.txt'), 'w', encoding='utf-8') as f:
        f.write(f"! RifqyShield {variant_name.capitalize()} List\n! Total Domains: {total_count}\n\n")
        for domain in sorted_domains:
            f.write(f"||{domain}^\n")

    # 3. WILDCARD
    with open(os.path.join(target_dir, 'wildcard.txt'), 'w', encoding='utf-8') as f:
        f.write(f"# RifqyShield {variant_name.capitalize()} Wildcard List\n# Total Domains: {total_count}\n\n")
        for domain in sorted_domains:
            f.write(f"*.{domain}\n")

    # 4. PLAIN
    with open(os.path.join(target_dir, 'plain.txt'), 'w', encoding='utf-8') as f:
        for domain in sorted_domains:
            f.write(f"{domain}\n")

def main():
    print("--- MEMULAI PROSES BUILD MULTI-VARIAN ---")

    # Loop untuk setiap varian (lite, medium, ultimate)
    for variant_name, file_list in VARIANTS.items():
        print(f"\nMemproses Varian: {variant_name.upper()}")
        unique_domains = set()

        for file_path in file_list:
            if os.path.exists(file_path):
                # print(f"  Membaca: {file_path}") # Uncomment jika ingin log detail
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        for line in f:
                            clean = clean_domain(line)
                            if clean:
                                unique_domains.add(clean)
                except Exception as e:
                    print(f"  [ERROR] Gagal membaca {file_path}: {e}")
            else:
                pass 
                # print(f"  [SKIP] File tidak ditemukan: {file_path}")

        # Tulis hasil ke folder masing-masing
        write_files(variant_name, unique_domains)

    print("\n--- SEMUA SELESAI ---")

if __name__ == "__main__":
    main()
