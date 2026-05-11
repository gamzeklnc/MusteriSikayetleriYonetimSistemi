using System;
using System.Linq;
using System.Collections.Generic;
using MiniExcelLibs;

class Program
{
    static void Main()
    {
        string filePath = @"C:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\KG-LST-002 MUSTERI SIKAYETLERI TAKIP SONN  GÜNCELFORM (JÜLİDE).xlsx";
        Console.WriteLine("Reading: " + filePath);
        
        var rawRows = MiniExcel.Query(filePath, useHeaderRow: false).ToList();
        
        // 2. satır (index=1) başlık satırı
        var headerRow = rawRows[1] as IDictionary<string, object>;
        
        var columnMap = new Dictionary<string, string>();
        foreach (var key in headerRow!.Keys)
        {
            var headerValue = headerRow[key]?.ToString()?.Trim() ?? "";
            if (!string.IsNullOrEmpty(headerValue))
                columnMap[key] = headerValue;
        }

        Console.WriteLine("Columns: " + string.Join(", ", columnMap.Select(kv => $"{kv.Key}={kv.Value}")));
        
        int rowNum = 0;
        int hakli = 0, haksiz = 0, bos = 0;
        var sampleDecisions = new List<string>();
        
        foreach (var rawRow in rawRows.Skip(2))
        {
            var rawDict = rawRow as IDictionary<string, object>;
            if (rawDict == null) continue;

            var dict = new Dictionary<string, object>();
            foreach (var kv in rawDict)
            {
                dict[kv.Key] = kv.Value ?? "";
                if (columnMap.TryGetValue(kv.Key, out var realName))
                    dict[realName] = kv.Value ?? "";
            }

            // ÖNCEKİ (HATALI) YOL: "R" harfi ile arama
            var decisionOLD = GetValue(dict, "R", "Haklı/Haksız", "Hakli/Haksiz", "Durum", "HAKLI/HAKSIZŞİKAYET", "HAKLI/HAKSIZSIKAYET");
            
            // YENİ (DÜZELTME): Sadece başlık isimleriyle arama
            var decisionNEW = GetValue(dict, "Haklı/Haksız", "Hakli/Haksiz", "Durum", "HAKLI/HAKSIZŞİKAYET", "HAKLI/HAKSIZSIKAYET");
            
            if (IsCheckedDecision(decisionNEW)) hakli++;
            else if (IsRejectedDecision(decisionNEW)) haksiz++;
            else bos++;
            
            rowNum++;
            if (rowNum <= 10)
            {
                Console.WriteLine($"Row {rowNum} - OLD(R): '{decisionOLD}' | NEW(fixed): '{decisionNEW}' -> Hakli:{IsCheckedDecision(decisionNEW)} Haksiz:{IsRejectedDecision(decisionNEW)}");
            }
        }
        
        Console.WriteLine($"\n=== SONUC (DUZELTME SONRASI) ===");
        Console.WriteLine($"Toplam Hakli: {hakli}");
        Console.WriteLine($"Toplam Haksiz: {haksiz}");
        Console.WriteLine($"Bos/Belirsiz: {bos}");
    }
    
    private static string NormalizeKey(string key)
    {
        if (string.IsNullOrEmpty(key)) return "";
        string normalized = key.ToLowerInvariant().Replace(" ", "").Trim();
        return normalized
            .Replace("\u015f", "s").Replace("\u00e7", "c")
            .Replace("\u0131", "i").Replace("\u00fc", "u")
            .Replace("\u00f6", "o").Replace("\u011f", "g")
            .Replace("ş", "s").Replace("ç", "c")
            .Replace("ı", "i").Replace("ü", "u")
            .Replace("ö", "o").Replace("ğ", "g");
    }

    private static string GetValue(IDictionary<string, object> dict, params string[] names)
    {
        var normalizedNames = names.Select(n => NormalizeKey(n)).ToList();
        foreach (var key in dict.Keys)
        {
            if (normalizedNames.Contains(NormalizeKey(key)))
                return dict[key]?.ToString()?.Trim() ?? "";
        }
        return "";
    }
    
    private static bool IsCheckedDecision(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var normalized = value.Trim().ToLowerInvariant();
        return normalized.Contains("✓") || normalized.Contains("✔") || normalized.Contains("√") || normalized.Equals("true") || normalized.Equals("evet") || normalized.Equals("hakli") || normalized.Equals("haklı");
    }

    private static bool IsRejectedDecision(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var normalized = value.Trim().ToLowerInvariant();
        return normalized.Equals("x") || normalized.Contains("✗") || normalized.Contains("✘") || normalized.Equals("false") || normalized.Equals("hayir") || normalized.Equals("hayır") || normalized.Equals("haksiz") || normalized.Equals("haksız");
    }
}
