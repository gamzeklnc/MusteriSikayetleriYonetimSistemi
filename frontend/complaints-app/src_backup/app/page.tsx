import { redirect } from "next/navigation";

export default function Home() {
  // Varsayılan olarak anasayfaya gelenleri login'e yönlendiriyoruz.
  // İlerleyen aşamalarda eğer kullanıcı zaten giriş yapmışsa direkt "/dashboard" adresine de yönlendirebiliriz.
  redirect("/login");
}

