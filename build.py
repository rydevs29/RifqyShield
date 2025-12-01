import os
import re

# ================= K O N F I G U R A S I =================

# Daftar file sumber yang ingin digabungkan
SOURCE_FILES = [
    "filters/blocklist/RifqyShield-BlockList.txt",
    "filters/blocklist/google-ads.txt",
    "filters/blocklist/blocklist.txt",
    "filters/blocklist/ads-xiaomi.txt",
    "filters/blocklist/ads-oppo-realme.txt",
    "filters/blocklist/ads-vivo.txt",
    "filters/blocklist/ads-huawei.txt",
    "filters/blocklist/ads-samsung.txt",
    "filters/youtube-ads/youtube-ads.txt",
    "filters/youtube-ads/youtube-ads2.txt",
    "filters/spotify-ads/spotify-ads.txt",
    "filters/spotify-ads/spotify-ads2.txt",
    "filters/nsfw/nsfw.txt",
    "filters/nsfw/nsfw-2.txt",
    "filters/nsfw/nsfw-3.txt",
    "filters/gambling/gambling.txt",
    "filters/gambling/gambling-2.txt",
    "filters/gambling/gambling-3.txt",
    "filters/blocklist/ultimate.txt"
]

# Folder output
OUTPUT_DIR = 'output'

# ================= L O G I K A   S C R I P T =================

def clean_domain(line):
    """
    Membersihkan baris menjadi domain murni.
    Contoh input: '||example.com^', '0.0.0.0 example.com', '*.example.com'
    Output: 'example.com'
    """
    # 1. Hapus komentar (# atau !) dan whitespace
    line = line.split('#')[0].split('!')[0].strip()
    if not line:
        return None

    # 2. Hapus prefix/suffix umum blocklist
    # Hapus IP local
    line = line.replace('127.0.0.1', '').replace('0.0.0.0', '')
    # Hapus simbol AdBlock/Wildcard
    line = line.replace('||', '').replace('^', '').replace('*.', '')
    
    # 3. Bersihkan sisa spasi
    domain = line.strip().lower()

    # 4. Validasi sederhana (harus ada titik dan tidak ada spasi lagi)
    if '.' in domain and ' ' not in domain and len(domain) > 3:
        return domain
    
    return None

def main():
    unique_domains = set() # Set otomatis menghapus duplikat

    print("--- MEMULAI PROSES BUILD ---")

    # 1. BACA SEMUA FILE
    for file_path in SOURCE_FILES:
        if os.path.exists(file_path):
            print(f"Membaca: {file_path}")
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    for line in f:
                        clean = clean_domain(line)
                        if clean:
                            unique_domains.add(clean)
            except Exception as e:
                print(f"  [ERROR] Gagal membaca {file_path}: {e}")
        else:
            print(f"  [SKIP] File tidak ditemukan: {file_path}")

    # 2. SORTIR DOMAIN
    sorted_domains = sorted(list(unique_domains))
    total_count = len(sorted_domains)
    print(f"\nTotal domain unik setelah deduplikasi: {total_count}")

    # 3. BUAT FOLDER OUTPUT JIKA BELUM ADA
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # 4. TULIS KE BERBAGAI FORMAT

    # -- Format HOSTS (0.0.0.0 domain) --
    print(f"Menulis {OUTPUT_DIR}/hosts.txt ...")
    with open(f'{OUTPUT_DIR}/hosts.txt', 'w', encoding='utf-8') as f:
        f.write(f"# RifqyShield Hosts File\n# Total Domains: {total_count}\n# Updated: Automatic Build\n\n")
        for domain in sorted_domains:
            f.write(f"0.0.0.0 {domain}\n")

    # -- Format ADBLOCK / UBLOCK (||domain^) --
    print(f"Menulis {OUTPUT_DIR}/adblock.txt ...")
    with open(f'{OUTPUT_DIR}/adblock.txt', 'w', encoding='utf-8') as f:
        f.write(f"! RifqyShield AdBlock List\n! Total Domains: {total_count}\n\n")
        for domain in sorted_domains:
            f.write(f"||{domain}^\n")

    # -- Format WILDCARD (*.domain) --
    print(f"Menulis {OUTPUT_DIR}/wildcard.txt ...")
    with open(f'{OUTPUT_DIR}/wildcard.txt', 'w', encoding='utf-8') as f:
        f.write(f"# RifqyShield Wildcard List\n# Total Domains: {total_count}\n\n")
        for domain in sorted_domains:
            f.write(f"*.{domain}\n")
            
    # -- Format PLAIN (domain saja) --
    print(f"Menulis {OUTPUT_DIR}/plain.txt ...")
    with open(f'{OUTPUT_DIR}/plain.txt', 'w', encoding='utf-8') as f:
        for domain in sorted_domains:
            f.write(f"{domain}\n")

    print("\n--- SELESAI ---")

if __name__ == "__main__":
    main()
