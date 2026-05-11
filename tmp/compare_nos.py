import pandas as pd
import sys

def get_nos(file_path):
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
        
    no_col = None
    for c in main_sheet.columns:
        if str(c).upper().strip() == "NO" or str(c).upper().strip() == "ŞİKAYET NO":
            no_col = c
            break
            
    if no_col:
        return set(main_sheet[no_col].dropna().astype(str).str.strip().tolist())
    return set()

file1 = r"C:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\KG-LST-002 MUSTERI SIKAYETLERI TAKIP SONN (JÜLİDE).xlsx"
file2 = r"C:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\KG-LST-002 MUSTERI SIKAYETLERI TAKIP SONN  GÜNCELFORM (JÜLİDE).xlsx"

nos_old = get_nos(file1)
nos_old = {n for n in nos_old if n.upper() != 'NO' and n.upper() != 'NAN'}

nos_new = get_nos(file2)
nos_new = {n for n in nos_new if n.upper() != 'NO' and n.upper() != 'NAN'}

print("Total unique NOs in Old File:", len(nos_old))
print("Total unique NOs in New File:", len(nos_new))

added = nos_new - nos_old
removed = nos_old - nos_new

print(f"\nNOs in NEW but not in OLD ({len(added)}):")
print(sorted(list(added)))

print(f"\nNOs in OLD but not in NEW ({len(removed)}):")
print(sorted(list(removed)))
