import pandas as pd
import sys

def get_complaint_numbers(file_path):
    df = pd.read_excel(file_path, sheet_name=None)
    sheets = list(df.keys())
    main_sheet = df["GENEL LİSTE"] if "GENEL LİSTE" in df else df[sheets[0]]
    
    header_idx = -1
    for i in range(min(5, len(main_sheet))):
        row_vals = [str(x).upper().strip() for x in main_sheet.iloc[i].values]
        if "NO" in row_vals or "ŞİRKET" in row_vals or "SIRKET" in row_vals:
            header_idx = i
            break
            
    if header_idx != -1:
        main_sheet.columns = main_sheet.iloc[header_idx]
        main_sheet = main_sheet.iloc[header_idx+1:].reset_index(drop=True)
        
    cols = [str(c).upper().strip() for c in main_sheet.columns]
    
    no_col, date_col = None, None
    for c in main_sheet.columns:
        col_name = str(c).upper().strip()
        if col_name == "NO" or col_name == "ŞİKAYET NO": no_col = c
        if "ŞİKAYET" in col_name and "TARİH" in col_name: date_col = c
        if "SIKAYET" in col_name and "TARIH" in col_name: date_col = c
        if col_name == "TARİH" or col_name == "TARIH": date_col = c
            
    res = set()
    if no_col and date_col:
        for idx, row in main_sheet.iterrows():
            no_val = str(row[no_col]).strip()
            if pd.isna(row[no_col]) or no_val.upper() == 'NO' or no_val.upper() == 'NAN' or not no_val:
                continue
            date_val = row[date_col]
            year = "00"
            if pd.notna(date_val):
                try:
                    dt = pd.to_datetime(date_val)
                    year = dt.strftime("%y")
                except:
                    pass
            try:
                serial_no = int(float(no_val))
                comp_num = f"{year}-{serial_no:03d}"
            except:
                comp_num = f"{year}-{no_val}"
            res.add(comp_num)
    return res

file1 = r"C:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\KG-LST-002 MUSTERI SIKAYETLERI TAKIP SONN (JÜLİDE).xlsx"
file2 = r"C:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\KG-LST-002 MUSTERI SIKAYETLERI TAKIP SONN  GÜNCELFORM (JÜLİDE).xlsx"

comp_old = get_complaint_numbers(file1)
comp_new = get_complaint_numbers(file2)

print("Old File Complaint Numbers Count:", len(comp_old))
print("New File Complaint Numbers Count:", len(comp_new))

print("\nSample Old:", sorted(list(comp_old))[:10])
print("\nSample New:", sorted(list(comp_new))[:10])

overlap = comp_old.intersection(comp_new)
print(f"\nOverlap Count: {len(overlap)}")
