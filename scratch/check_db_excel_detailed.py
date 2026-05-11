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

def format_complaint_no(val):
    if pd.isna(val):
        return None
    val = str(val).strip().replace('.0', '')
    if len(val) >= 3 and '-' not in val:
        # e.g., 2501 -> 25-01, 21001 -> 21-001
        if len(val) == 4:
            val = f"{val[:2]}-0{val[2:]}" # 2501 -> 25-01 wait, 2501 in db might be 25-01 or 25-001. DB has 21-001, 22-005. So it's YY-XXX.
            # If length is 4 (e.g. 2501) maybe it is 25-001? Or 25-01? Let's check db format. DB has 21-001. Let's just do standard dash insertion if missing, but let's just collect raw and formatted.
    return str(val)

def main():
    excel_dir = r"c:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar"
    
    file1 = os.path.join(excel_dir, "KG-LST-002 MUSTERI SIKAYETLERI GÜNCEL EXCEL (JÜLİDE).xlsx")
    file2 = os.path.join(excel_dir, "KG-LST-002 MUSTERI SIKAYETLERI TAKIP.xlsx")
    
    # 1. DB Complaints
    db_data = run_sql("SELECT ComplaintNumber FROM Complaints")
    db_complaints = set(row['ComplaintNumber'].strip() for row in db_data)
    print(f"DB Total Complaints: {len(db_complaints)}")

    # 2. Excel 1 (JÜLİDE)
    try:
        df1 = pd.read_excel(file1, sheet_name=0, header=1)
        excel1_nos = set(df1['NO'].dropna().astype(str).str.strip().str.replace('.0', ''))
        print(f"Excel 1 Total Unique Complaint Numbers: {len(excel1_nos)}")
        
        # Format Excel 1
        excel1_formatted = set()
        for x in excel1_nos:
            if '-' not in x and len(x) >= 4:
                # 2501 -> 25-01
                if len(x) == 4:
                    formatted = f"{x[:2]}-0{x[2:]}"
                else:
                    formatted = f"{x[:2]}-{x[2:]}"
                excel1_formatted.add(formatted)
            else:
                excel1_formatted.add(x)
                
        missing_in_db_1 = excel1_formatted - db_complaints
        missing_in_excel_1 = db_complaints - excel1_formatted
        print(f"  -> In Excel 1 but NOT in DB: {len(missing_in_db_1)}")
        if len(missing_in_db_1) > 0:
             print(f"     Examples: {list(missing_in_db_1)[:5]}")
        print(f"  -> In DB but NOT in Excel 1: {len(missing_in_excel_1)}")
        if len(missing_in_excel_1) > 0:
             print(f"     Examples: {list(missing_in_excel_1)[:5]}")

    except Exception as e:
        print(f"Error reading Excel 1: {e}")

    # 3. Excel 2 (TAKIP)
    try:
        df2 = pd.read_excel(file2, sheet_name=0, header=None)
        # Find column that might be Complaint Number. It's usually the first column if it's TAKIP
        excel2_nos = set(df2[0].dropna().astype(str).str.strip().str.replace('.0', ''))
        # Remove non-numeric/non-format rows
        excel2_nos = {x for x in excel2_nos if x[0].isdigit()}
        print(f"\nExcel 2 Total Unique Complaint Numbers: {len(excel2_nos)}")
        
        # Format Excel 2
        excel2_formatted = set()
        for x in excel2_nos:
            if '-' not in x and len(x) >= 4:
                if len(x) == 4:
                    formatted = f"{x[:2]}-0{x[2:]}"
                else:
                    formatted = f"{x[:2]}-{x[2:]}"
                excel2_formatted.add(formatted)
            else:
                excel2_formatted.add(x)
                
        missing_in_db_2 = excel2_formatted - db_complaints
        print(f"  -> In Excel 2 but NOT in DB: {len(missing_in_db_2)}")
        if len(missing_in_db_2) > 0:
             print(f"     Examples: {list(missing_in_db_2)[:5]}")

    except Exception as e:
        print(f"Error reading Excel 2: {e}")

if __name__ == '__main__':
    main()
