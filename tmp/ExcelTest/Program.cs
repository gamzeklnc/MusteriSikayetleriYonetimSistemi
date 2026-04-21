using System;
using System.IO;
using System.Linq;
using MiniExcelLibs;

class Program {
    static void Main(string[] args) {
        var path = @"C:\Users\yasin\MusteriSikayetleriYonetimSistemi\Excel_Aktar\KG-LST-002 MUSTERI SIKAYETLERI TAKIP.xlsx";
        
        var genelListeRows = MiniExcel.Query(path, useHeaderRow: false, sheetName: "GENEL LİSTE").Take(3).ToList();
        Console.WriteLine("GENEL LİSTE First 3 rows:");
        foreach(var row in genelListeRows) {
            var dict = row as System.Collections.Generic.IDictionary<string, object>;
            Console.WriteLine(string.Join(" | ", dict?.Select(x => $"{x.Key}={x.Value}") ?? new string[0]));
        }
    }
}
