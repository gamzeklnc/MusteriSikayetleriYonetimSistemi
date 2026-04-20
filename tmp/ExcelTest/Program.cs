using MiniExcelLibs;
using System;
using System.Linq;

class Program
{
    static void Main()
    {
        string path = @"C:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\KG-LST-002 MUSTERI SIKAYETLERI TAKIP.xlsx";
        var rows = MiniExcel.Query(path, useHeaderRow: true).ToList();
        
        if (rows.Count > 0)
        {
            Console.WriteLine("Headers:");
            var firstRow = rows[0] as IDictionary<string, object>;
            foreach (var key in firstRow.Keys)
            {
                Console.WriteLine($"- {key}");
            }
            Console.WriteLine("\nFirst Row Data:");
            foreach (var kvp in firstRow)
            {
                Console.WriteLine($"{kvp.Key}: {kvp.Value}");
            }
        }
        else
        {
            Console.WriteLine("File is empty.");
        }
    }
}
