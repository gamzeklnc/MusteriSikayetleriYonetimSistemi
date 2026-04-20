using System;
using System.Collections.Generic;
using System.Linq;
using MiniExcelLibs;

namespace ExcelCheck
{
    class Program
    {
        static void Main(string[] args)
        {
            var path = @"c:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\ÜRT ADETLERİ.xlsx";
            var rawRows = MiniExcel.Query(path, sheetName: "Sayfa2", useHeaderRow: false).ToList();
            
            for(int i=0; i<Math.Min(20, rawRows.Count); i++)
            {
                var row = rawRows[i] as IDictionary<string, object>;
                if (row != null) {
                    Console.WriteLine($"Row {i}:");
                    foreach(var kv in row.Take(15)) Console.WriteLine($"  {kv.Key} => {kv.Value}");
                }
            }
        }
    }
}
