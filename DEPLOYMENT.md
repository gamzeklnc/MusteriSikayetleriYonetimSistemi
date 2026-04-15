# Sirket Agi Icin Deployment Rehberi

Bu proje su mimariyle calisir:

- Frontend: Next.js 15 (`frontend/complaints-app`)
- Backend: ASP.NET Core Web API .NET 8 (`backend/ComplaintsAPI/src/ComplaintsAPI`)
- Veritabani: Microsoft SQL Server
- Dosya yukleme alani: API altinda `wwwroot/uploads/complaint-documents`

Bu uygulama icin sirket ici kullanimda en pratik ve bakimi en kolay kurulum:

- Windows Server 2022 veya 2019
- IIS reverse proxy
- Backend icin Kestrel + Windows Service
- Frontend icin Node.js + Windows Service
- SQL Server ayri ya da ayni sunucuda

## 1. Onerilen Topoloji

En temiz yapi:

- `http://sikayet-app.sirket.local` -> Frontend
- `http://sikayet-api.sirket.local` -> Backend API
- SQL Server sadece uygulama sunucusundan erisilebilir

Alternatif:

- Tek alan adi: `http://sikayet.sirket.local`
- Frontend kokte
- API `/api` altindan proxylenir

Bu projede frontend API adresini `NEXT_PUBLIC_API_URL` ile aldigi icin iki ayri hostname kullanimi daha kolaydir.

## 2. Canliya Cikmadan Once Zorunlu Uygulama Kontrolleri

Canliya almadan once bunlari mutlaka yapin:

1. `backend/ComplaintsAPI/src/ComplaintsAPI/appsettings.Production.json` icindeki su alanlari gercek degerlerle doldurun:
   - `ConnectionStrings:DefaultConnection`
   - `Jwt:Key`
   - `EmailSettings:Password`
   - `AllowedOrigins`
2. Varsayilan admin kullanicisina ait sifreyi degistirin.
   Varsayilan kayit migration seed icinde geliyor:
   - e-posta: `admin@sirket.com`
   - sifre: `admin123`
3. SMTP erisiminin sirket agindan acik oldugunu test edin.
4. Dosya yukleme klasoru icin yedekleme plani olusturun.
5. Frontend ortam degiskeninde API adresini localhost yerine sunucu adresi olarak tanimlayin.

Not:
Frontend tarafinda sabit `localhost` kullanan `userActivityLogService.ts` duzeltildi; artik `NEXT_PUBLIC_API_URL` kullaniyor.

## 3. Sunucu Gereksinimleri

Uretim icin minimum:

- 4 vCPU
- 8 GB RAM
- 120 GB disk
- Windows Server 2019/2022
- Statik IP
- Domain veya en azindan DNS kaydi

Onerilen klasor yapisi:

- `C:\Apps\Complaints\frontend`
- `C:\Apps\Complaints\backend`
- `C:\Apps\Complaints\data\uploads`
- `C:\Apps\Complaints\logs`
- `C:\Backups\Complaints`

## 4. Sunucu Hazirligi

### 4.1 Windows guncellemeleri

- Tum Windows update'leri yukleyin.
- Sunucuyu domaine alin.
- Saat ve timezone ayarlarini dogrulayin.

### 4.2 Gerekli bilesenler

Sunucuya su bilesenleri kurun:

- IIS
- IIS URL Rewrite
- IIS Application Request Routing (ARR)
- .NET 8 Hosting Bundle
- Node.js 20 LTS
- SQL Server Management Studio
- SQL Server 2019/2022 veya mevcut SQL instance baglantisi

IIS rollerinde en az su ozellikler acik olsun:

- Web Server
- Static Content
- Default Document
- Request Filtering
- Application Initialization
- ASP.NET Core Module
- Management Console

### 4.3 Servis hesabi

Domain ortaminda ayri bir servis hesabi kullanin:

- Ornek: `SRK\svc_complaints`

Bu hesaba asagidaki yetkileri verin:

- Uygulama klasorlerinde okuma/yazma
- Log klasorunde yazma
- Upload klasorunde yazma/silme
- SQL veritabanina login yetkisi

## 5. SQL Server Kurulumu ve Hazirligi

### 5.1 Veritabani olusturma

Ornek:

- Veritabani adi: `MusteriSikayet`
- SQL login: `complaints_app`

Oneri:

- SQL Authentication kullanin
- Ayrica uygulama icin `db_owner` yerine mumkunse sinirli yetki verin
- Ama migration calisacaksa ilk kurulumda gecici olarak yuksek yetki gerekebilir

### 5.2 Ornek SQL

```sql
CREATE LOGIN complaints_app WITH PASSWORD = 'GucluBirSifre!';
GO

CREATE DATABASE MusteriSikayet;
GO

USE MusteriSikayet;
GO

CREATE USER complaints_app FOR LOGIN complaints_app;
GO

ALTER ROLE db_owner ADD MEMBER complaints_app;
GO
```

### 5.3 Firewall

SQL ayri sunucudaysa:

- Sadece uygulama sunucusunun IP'sinden 1433 erisimine izin verin
- Public veya genis ag erisimini acmayin

## 6. Uygulama Konfigurasyonu

### 6.1 Backend Production ayari

`backend/ComplaintsAPI/src/ComplaintsAPI/appsettings.Production.json`

Asagidaki gibi gercek degerlerle duzenleyin:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=SQLSUNUCU\\INSTANCE;Database=MusteriSikayet;User Id=complaints_app;Password=GUCLU_SIFRE;TrustServerCertificate=True;"
  },
  "AllowedOrigins": [
    "http://sikayet-app.sirket.local",
    "http://sikayet.sirket.local"
  ],
  "Jwt": {
    "Key": "EN_AZ_32_KARAKTER_COK_GUCLU_BIR_ANAHTAR",
    "Issuer": "ComplaintsAPI",
    "Audience": "ComplaintsApp"
  },
  "EmailSettings": {
    "Host": "mail.sunucu.local",
    "Port": 465,
    "Username": "report@sirket.local",
    "Password": "MAIL_SIFRESI",
    "EnableSsl": true
  }
}
```

Onemli:

- `Jwt:Key` en az 32 karakter olsun
- `AllowedOrigins` sadece gercek kullanacaginiz adresleri icersin
- Burada placeholder birakmayin

### 6.2 Frontend env

Sunucuda `frontend/complaints-app/.env.production` dosyasi olusturun:

```env
NEXT_PUBLIC_API_URL=http://sikayet-api.sirket.local
```

Eger HTTPS kullanacaksaniz:

```env
NEXT_PUBLIC_API_URL=https://sikayet-api.sirket.local
```

## 7. Build ve Publish

### 7.1 Backend publish

`backend/ComplaintsAPI/src/ComplaintsAPI` klasorunde:

```powershell
dotnet restore
dotnet publish -c Release -o C:\Apps\Complaints\backend
```

### 7.2 Frontend build

`frontend/complaints-app` klasorunde:

```powershell
npm install
npm run build
```

Canli calisma icin uygulama dosyalarini su sekilde kopyalayin:

- `.next`
- `public`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `.env.production`
- `src` klasoru genelde runtime icin gerekmez ama sorun yasamamak icin tum proje klasorunu deploy etmek daha pratiktir

Pratik yol:

- `frontend/complaints-app` klasorunun tamamini `C:\Apps\Complaints\frontend` altina alin
- Sunucuda bir kez `npm install --omit=dev` calistirin

## 8. Veritabani Migration

Ilk kurulumda migration calistirin:

```powershell
cd C:\Apps\Complaints\backend
dotnet ComplaintsAPI.dll
```

Bu komut migration calistirmaz; sadece uygulamayi baslatir. Bu projede migration ayri uygulanmali.

Sunucuda ya da build makinesinde proje kokunden:

```powershell
cd backend\ComplaintsAPI\src\ComplaintsAPI
dotnet tool restore
dotnet ef database update --configuration Release
```

Eger `dotnet ef` sunucuda calismiyorsa build makinesinde SQL'e baglanarak da migration uygulanabilir.

Kontrol edin:

- `Departments` seed gelmis olmali
- `ErrorDefinitionOptions` seed gelmis olmali
- Admin kullanicisi gelmis olmali

## 9. Upload Klasoru ve Izinler

Bu uygulama dokumanlari fiziksel olarak API altinda su mantikla kaydediyor:

- `wwwroot/uploads/complaint-documents`

Canli ortamda:

1. `C:\Apps\Complaints\backend\wwwroot\uploads\complaint-documents` klasorunu olusturun
2. Servis hesabina Modify yetkisi verin
3. Bu klasoru gunluk yedeklemeye dahil edin
4. Antiviruste bu klasor icin asiri agresif engelleme olmadigini kontrol edin

## 10. Backend'i Windows Service Olarak Calistirma

Windows Service icin en rahat yontem `nssm` kullanmaktir.

### 10.1 NSSM kurulum mantigi

- NSSM indirip sunucuya koyun
- Servis adi: `ComplaintsApi`

Komut:

- Uygulama: `C:\Program Files\dotnet\dotnet.exe`
- Arguman: `C:\Apps\Complaints\backend\ComplaintsAPI.dll`
- Startup directory: `C:\Apps\Complaints\backend`

Ortam degiskenleri:

- `ASPNETCORE_ENVIRONMENT=Production`
- `ASPNETCORE_URLS=http://127.0.0.1:5000`

Bu sayede API sadece lokal portta dinler, dis ag erisimi IIS uzerinden olur.

## 11. Frontend'i Windows Service Olarak Calistirma

Yine `nssm` ile:

- Servis adi: `ComplaintsFrontend`
- Uygulama: `C:\Program Files\nodejs\node.exe`
- Arguman: `C:\Apps\Complaints\frontend\node_modules\next\dist\bin\next start -p 3000 -H 127.0.0.1`
- Startup directory: `C:\Apps\Complaints\frontend`

Oncesinde:

```powershell
cd C:\Apps\Complaints\frontend
npm install --omit=dev
```

## 12. IIS Reverse Proxy Yapilandirmasi

### 12.1 ARR proxy acma

IIS'te:

- Server node
- Application Request Routing Cache
- Server Proxy Settings
- `Enable proxy` aktif edin

### 12.2 Frontend site

Site:

- Site name: `ComplaintsFrontend`
- Binding: `http`, port `80`, host `sikayet-app.sirket.local`

URL Rewrite kurali:

- Tum istekleri `http://127.0.0.1:3000` adresine yonlendirin

### 12.3 API site

Site:

- Site name: `ComplaintsApi`
- Binding: `http`, port `80`, host `sikayet-api.sirket.local`

URL Rewrite kurali:

- Tum istekleri `http://127.0.0.1:5000` adresine yonlendirin

### 12.4 Tek domain kullanmak isterseniz

Tek alan adinda:

- `/api` -> `127.0.0.1:5000`
- diger tum istekler -> `127.0.0.1:3000`

Ama iki ayri hostname ile sorun ayiklama daha kolaydir.

## 13. Firewall ve Ag Ayarlari

Sunucuda yalniz gerekli portlari acin:

- 80 veya 443 -> kullanici istemcileri icin
- 1433 -> sadece uygulama sunucusu ile SQL arasinda gerekiyorsa

Disariya acik olmamasi gerekenler:

- 3000
- 5000

Bu portlar sadece `127.0.0.1` dinlemelidir.

## 14. HTTPS ve Sertifika

Sirket ici olsa bile HTTPS kullanin.

Secenekler:

- Kurum ici CA sertifikasi
- Active Directory Certificate Services
- Reverse proxy uzerinde SSL termination

IIS binding:

- `https`
- 443
- dogru hostname
- kurum sertifikasi

Bu durumda:

- Frontend adresi `https://sikayet-app.sirket.local`
- API adresi `https://sikayet-api.sirket.local`
- `AllowedOrigins` ve `NEXT_PUBLIC_API_URL` buna gore guncellenmeli

## 15. Loglama ve Izleme

Backend Serilog ile dosyaya log yaziyor:

- `logs/app-*.log`

Canli ortamda:

- `C:\Apps\Complaints\backend\logs` klasorunu olusturun
- Disk dolulugu icin log rotasyonu ve temizlik plani yapin
- Windows Event Viewer ve servis restart davranisini izleyin

Izlenmesi gerekenler:

- API servis durumu
- Frontend servis durumu
- SQL baglanti hatalari
- SMTP hatalari
- Disk dolulugu
- Upload klasoru boyutu

## 16. Yedekleme Plani

Mutlaka yedekleyin:

- SQL veritabani
- `C:\Apps\Complaints\backend\wwwroot\uploads`
- `appsettings.Production.json`
- `.env.production`

Onerilen:

- Veritabani: gunluk full backup
- Kritik saatlerde transaction log backup
- Upload klasoru: gunluk incremental backup

## 17. Ilk Canli Test Senaryolari

Canliya aldiktan sonra su testleri yapin:

1. Login olun
2. Yeni sikayet olusturun
3. Mail bildirimini kontrol edin
4. Dokuman yukleyin
5. Dokumani indirin
6. Kalite raporu adimini tamamlayin
7. Yonetim onayini test edin
8. Musteri geri donusu adimini test edin
9. Rapor ekranlarini kontrol edin
10. Farkli istemci bilgisayardan uygulamaya erisimi test edin

## 18. Operasyonel Check-list

Canliya cikmadan once:

- DNS kayitlari acildi
- Sunucu domaine alindi
- IIS kuruldu
- URL Rewrite ve ARR kuruldu
- .NET 8 Hosting Bundle kuruldu
- Node.js 20 LTS kuruldu
- SQL veritabani hazirlandi
- Production config dolduruldu
- Migration basarili calisti
- Upload klasoru ve izinler tanimlandi
- Servisler olusturuldu
- IIS proxy aktif edildi
- Firewall kurallari yapildi
- HTTPS baglandi
- Yedekleme tanimlandi
- UAT testleri tamamlandi

## 19. Bu Proje Icin Dikkat Edilmesi Gereken Ozel Riskler

1. `appsettings.Production.json` icinde su an placeholder degerler var; gercek degerlerle degistirilmezse uygulama acilsa bile login, mail veya veritabani baglantisi calismaz.
2. Seed ile gelen admin kullanicisi varsayilan sifreyle kalirsa guvenlik riski olusur.
3. Upload dosyalari veritabaninda degil diskte tutuluyor; bu nedenle sadece SQL backup yeterli degildir.
4. CORS ayarinda sadece gercek kullanilan adresler olmali; fazla genis bir liste gereksiz risk yaratir.
5. SMTP sifresi bos kalirsa sistem e-posta gondermez, sadece simule eder.

## 20. Onerdigim Canliya Alma Sirasi

1. Sunucuyu hazirlayin
2. SQL Server ve veritabanini hazirlayin
3. DNS ve hostname'leri tanimlayin
4. Production config dosyalarini doldurun
5. Backend publish alin
6. Frontend build alin
7. Dosyalari sunucuya kopyalayin
8. Migration calistirin
9. Upload ve log klasorlerini olusturun
10. Windows service'leri kurun
11. IIS reverse proxy'yi baglayin
12. HTTPS ve firewall ayarlarini yapin
13. UAT testlerini tamamlayin
14. Kullanicilara erisim verin

## 21. Isterseniz Sonraki Adim Olarak

Bu repoya su dosyalari da hazirlayabilirim:

- ornek `appsettings.Production.json`
- ornek `.env.production`
- IIS `web.config` reverse proxy dosyalari
- `nssm` veya PowerShell ile otomatik servis kurulum scripti
- canliya alma kontrol listesi
