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
            var path = @"C:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\KG-LST-002 MUSTERI SIKAYETLERI TAKIP.xlsx";
            var rawRows = MiniExcel.Query(path, useHeaderRow: false).ToList();
            
            var row0 = rawRows[0] as IDictionary<string, object>;
            Console.WriteLine("Row 0:");
            foreach(var kv in row0) Console.WriteLine($"{kv.Key} => {kv.Value}");

            var row1 = rawRows[1] as IDictionary<string, object>;
            Console.WriteLine("\nRow 1:");
            foreach(var kv in row1) Console.WriteLine($"{kv.Key} => {kv.Value}");
        }
    }
}
