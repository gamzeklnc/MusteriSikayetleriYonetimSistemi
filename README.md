# Müşteri Şikayetleri Yönetim Sistemi

Şirket içi müşteri şikayetleri yönetim ve workflow sistemi.

## Proje Yapısı (Monorepo)

```
├── backend/ComplaintsAPI/   → ASP.NET Core Web API (.NET 8)
└── frontend/complaints-app/ → Next.js 15 (TypeScript + Tailwind CSS)
```

---

## Backend Kurulumu

### Gereksinimler
- .NET 8 SDK
- Microsoft SQL Server

### Veritabanı Bağlantısı
`backend/ComplaintsAPI/src/ComplaintsAPI/appsettings.json` dosyasındaki connection string'i güncelleyin:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=SUNUCU_ADI;Database=ComplaintsDB;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

> ⚠️ **JWT Key'i mutlaka değiştirin!** `appsettings.json` dosyasındaki `Jwt:Key` alanını güçlü bir değerle değiştirin.

### Çalıştırma

```bash
cd backend/ComplaintsAPI/src/ComplaintsAPI

# Migration oluştur
dotnet ef migrations add InitialCreate

# Veritabanını oluştur (departman seed data dahil)
dotnet ef database update

# Projeyi başlat
dotnet run
```

API şu adreste çalışacak: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/swagger`

---

## Frontend Kurulumu

### Gereksinimler
- Node.js 18+

### Çalıştırma

```bash
cd frontend/complaints-app
npm install
npm run dev
```

Uygulama şu adreste çalışacak: `http://localhost:3000`

### Ortam Değişkenleri
`.env.local` dosyası zaten oluşturulmuştur:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Tech Stack

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | ASP.NET Core Web API (.NET 8) |
| Veritabanı | Microsoft SQL Server |
| ORM | Entity Framework Core 8 |
| Auth | JWT Bearer |
| Loglama | Serilog |
| API Dokümantasyon | Swagger / OpenAPI |
| Şifreleme | BCrypt.Net-Next |

---

## Departmanlar (Seed Data)

Sistem ilk kurulumda otomatik olarak şu departmanları oluşturur:

| ID | Ad |
|---|---|
| 1 | Satış |
| 2 | Kalite |
| 3 | Kalite Güvence |
| 4 | Yönetim |
| 5 | Admin |
