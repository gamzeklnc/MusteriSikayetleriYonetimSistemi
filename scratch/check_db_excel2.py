import pandas as pd
import subprocess
import os

def run_sql(query):
    cmd = [
        "sqlcmd", "-S", r"PORTALSRV\PORTALSRV", "-d", "MusteriSikayet",
        "-U", "bt", "-P", "Qwer1234.", "-C", "-W", "-s", "\t", "-Q", query
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return []
    lines = result.stdout.strip().split('\n')
    if len(lines) < 3:
        return []
    headers = lines[0].split('\t')
    data = []
    for line in lines[2:]:
        if 'rows affected' in line or not line.strip():
            continue
        row = line.split('\t')
        row_dict = dict(zip(headers, row))
        data.append(row_dict)
    return data

def main():
    excel_dir = r"c:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar"
    
    file1 = os.path.join(excel_dir, "KG-LST-002 MUSTERI SIKAYETLERI GÜNCEL EXCEL (JÜLİDE).xlsx")
    file2 = os.path.join(excel_dir, "KG-LST-002 MUSTERI SIKAYETLERI TAKIP.xlsx")
    file3 = os.path.join(excel_dir, "ÜRT ADETLERİ.xlsx")
    
    print("--- EXCEL 1: JÜLİDE ---")
    try:
        df1 = pd.read_excel(file1, sheet_name=0, header=1) # Often these have headers on row 2
        print(f"Columns: {df1.columns.tolist()[:10]}...")
        if 'Şikayet Numarası' in df1.columns:
            print(f"Unique Şikayet Numarası count: {df1['Şikayet Numarası'].nunique()}")
        elif 'ŞİKAYET NO' in df1.columns:
            print(f"Unique ŞİKAYET NO count: {df1['ŞİKAYET NO'].nunique()}")
    except Exception as e:
        print(e)

    print("\n--- EXCEL 2: TAKIP ---")
    try:
        df2 = pd.read_excel(file2, sheet_name=0, header=2)
        print(f"Columns: {df2.columns.tolist()[:10]}...")
        for col in df2.columns:
            if 'ŞİKAYET NO' in str(col).upper() or 'SIKAYET' in str(col).upper():
                print(f"Found complaint col: {col}")
                print(f"Unique {col} count: {df2[col].nunique()}")
    except Exception as e:
        print(e)

if __name__ == '__main__':
    main()
