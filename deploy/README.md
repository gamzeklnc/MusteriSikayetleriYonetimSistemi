# Deployment Dosyalari

Bu klasor uretim kurulumu icin hazir dosyalari icerir.

## Icerik

- `backend/appsettings.Production.template.json`
  Uretim backend ayar sablonu
- `frontend/.env.production.template`
  Uretim frontend ortam degiskeni sablonu
- `iis/frontend/web.config`
  Frontend reverse proxy ornegi
- `iis/api/web.config`
  API reverse proxy ornegi
- `scripts/Prepare-ServerFolders.ps1`
  Sunucuda klasor yapisini olusturur
- `scripts/Install-ComplaintsServices.ps1`
  NSSM ile servisleri olusturur
- `scripts/Publish-LocalBuild.ps1`
  Bu makinede publish ve build almak icin yardimci script

## Kullanim Ozeti

1. Sablon dosyalari gercek degerlerle doldurun.
2. Sunucuda klasorleri olusturun.
3. Backend publish ve frontend build alin.
4. Dosyalari sunucuya kopyalayin.
5. IIS ve servisleri ayaga kaldirin.
