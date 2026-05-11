import pandas as pd
import subprocess
import os
import json

def run_sql(query):
    cmd = [
        "sqlcmd", "-S", r"PORTALSRV\PORTALSRV", "-d", "MusteriSikayet",
        "-U", "bt", "-P", "Qwer1234.", "-C", "-W", "-s", "\t", "-Q", query
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("SQL Error:", result.stderr)
        return []
    
    # Process output
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
    
    # 1. Check Complaints vs Excel
    print("--- COMPLAINTS ---")
    db_complaints_count = run_sql("SELECT COUNT(*) as count FROM Complaints")[0]['count']
    print(f"Database Complaints Count: {db_complaints_count}")
    
    file1 = os.path.join(excel_dir, "KG-LST-002 MUSTERI SIKAYETLERI GÜNCEL EXCEL (JÜLİDE).xlsx")
    file2 = os.path.join(excel_dir, "KG-LST-002 MUSTERI SIKAYETLERI TAKIP.xlsx")
    
    try:
        df1 = pd.read_excel(file1, sheet_name=0)
        print(f"Excel 1 ({os.path.basename(file1)}) Rows: {len(df1)}")
    except Exception as e:
        print(f"Error reading Excel 1: {e}")

    try:
        df2 = pd.read_excel(file2, sheet_name=0)
        print(f"Excel 2 ({os.path.basename(file2)}) Rows: {len(df2)}")
    except Exception as e:
        print(f"Error reading Excel 2: {e}")

    # 2. Check Production Counts vs Excel
    print("\n--- PRODUCTION COUNTS ---")
    db_prod_count = run_sql("SELECT COUNT(*) as count FROM ProductionCounts")[0]['count']
    print(f"Database ProductionCounts Count: {db_prod_count}")
    
    file3 = os.path.join(excel_dir, "ÜRT ADETLERİ.xlsx")
    try:
        df3 = pd.read_excel(file3, sheet_name=0)
        print(f"Excel 3 ({os.path.basename(file3)}) Rows: {len(df3)}")
    except Exception as e:
        print(f"Error reading Excel 3: {e}")

    # 3. Check Barcodes vs Excel
    print("\n--- BARCODES ---")
    db_barcode_count = run_sql("SELECT COUNT(*) as count FROM ComplaintBarcodeResults")[0]['count']
    print(f"Database Barcode Results Count: {db_barcode_count}")

if __name__ == '__main__':
    main()
