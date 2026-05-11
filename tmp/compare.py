import pandas as pd
import sys
import os

with open('output.txt', 'w', encoding='utf-8') as f:
    def print_safe(*args):
        f.write(" ".join(map(str, args)) + "\n")
        print(*args) # Just try

    try:
        file1 = r"C:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\KG-LST-002 MUSTERI SIKAYETLERI TAKIP SONN (JÜLİDE).xlsx"
        file2 = r"C:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\KG-LST-002 MUSTERI SIKAYETLERI TAKIP SONN  GÜNCELFORM (JÜLİDE).xlsx"

        print_safe("Loading Old File:", file1)
        df1 = pd.read_excel(file1, sheet_name=None)
        print_safe("Loading New File:", file2)
        df2 = pd.read_excel(file2, sheet_name=None)
        
        print_safe("\n--- Sheet Names ---")
        print_safe("Old file sheets:", list(df1.keys()))
        print_safe("New file sheets:", list(df2.keys()))

        def get_main_sheet(sheets):
            if "GENEL LİSTE" in sheets: return sheets["GENEL LİSTE"]
            if "BARKODLAR" in sheets: return sheets["BARKODLAR"]
            # return first sheet
            return sheets[list(sheets.keys())[0]]

        def analyze_sheet(df, name):
            print_safe(f"\n--- Analysis for {name} ---")
            header_idx = -1
            for i in range(min(5, len(df))):
                row_vals = [str(x).upper().strip() for x in df.iloc[i].values]
                if "NO" in row_vals or "ŞİRKET" in row_vals or "SIRKET" in row_vals or "SİRKET" in row_vals:
                    header_idx = i
                    break
            
            if header_idx != -1:
                df.columns = df.iloc[header_idx]
                df = df.iloc[header_idx+1:].reset_index(drop=True)
                print_safe("Found header at row index", header_idx)
            else:
                print_safe("Could not reliably find header row, using default.")

            cols = [str(c).upper().strip() for c in df.columns]
            print_safe("Columns found:", [c for c in cols if c != 'NAN'])

            no_col = None
            for c in df.columns:
                if str(c).upper().strip() == "NO" or str(c).upper().strip() == "ŞİKAYET NO":
                    no_col = c
                    break

            if no_col:
                valid_rows = df[df[no_col].notna() & (df[no_col] != "NO") & (df[no_col] != "no")]
                num_complaints = valid_rows[no_col].nunique()
                print_safe("Number of unique NOs (complaints):", num_complaints)
                print_safe("Total valid rows (items):", len(valid_rows))
            else:
                print_safe("No 'NO' column found!")

            durum_col = None
            for c in df.columns:
                col_str = str(c).upper().strip()
                if "HAK" in col_str or "DURUM" in col_str:
                    durum_col = c
                    break
            
            if durum_col:
                print_safe(f"Durum column found: '{durum_col}'")
                val_counts = df[durum_col].astype(str).value_counts()
                print_safe("Durum values:\n", val_counts.to_string())
            else:
                print_safe("No Durum column found!")

        print_safe("\nOLD FILE ANALYSIS")
        analyze_sheet(get_main_sheet(df1), "Old File Main Sheet")

        print_safe("\nNEW FILE ANALYSIS")
        analyze_sheet(get_main_sheet(df2), "New File Main Sheet")

    except Exception as e:
        import traceback
        traceback.print_exc(file=f)
