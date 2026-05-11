using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using MiniExcelLibs;

class Program
{
    static void Main()
    {
        string filePath = @"c:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\ÜRT ADETLERİ.xlsx";
        using var stream = File.OpenRead(filePath);
        var sheetNames = MiniExcel.GetSheetNames(stream);
        string targetSheet = "Sayfa2";
        
        Console.WriteLine("Sheet found: " + sheetNames.Contains(targetSheet));

        var allRows = stream.Query(sheetName: targetSheet, useHeaderRow: false).ToList();
        Console.WriteLine("Total Rows: " + allRows.Count);

        for (int i = 0; i < Math.Min(5, allRows.Count); i++)
        {
            var r = allRows[i] as IDictionary<string, object>;
            if (r != null)
                Console.WriteLine($"Row {i + 1}: " + string.Join(" | ", r.Select(kv => $"{kv.Key}={kv.Value}")));
        }
    }
}
