# Vardiya Programı Uygulaması

Web tabanlı, paylaşılabilir vardiya programı oluşturma ve yönetim uygulaması.

## Özellikler

### Takım ve Kişi Yönetimi
- Birden fazla takım oluşturabilirsiniz
- Her takım için kişi ekleyip silebilirsiniz
- Her takımın kendi bağımsız programı vardır

### Vardiya Tipleri

**Standart Vardiyalar:**
- **918** - Mavi renk
- **1322** - Kırmızı renk
- **1500** - Yeşil renk
- **Off** - Gri renk

**Manuel Eklenebilir Vardiyalar:**
- **Rapor** - Turuncu renk
- **Yıllık İzin** - Mor renk
- **Ücretsiz İzin** - Turuncu-kahverengi renk

### Program Görünümleri

- **Haftalık Görünüm**: Seçilen tarih aralığındaki tüm günleri tek tabloda gösterir
- **Aylık Görünüm**: Seçilen tarih aralığını haftalara bölerek gösterir

### Otomatik Program Oluşturma

Uygulama, belirlenen kurallara göre otomatik olarak vardiya programı oluşturabilir:

1. **Haftalık Çalışma Limiti**: Herkes haftada maksimum 6 gün çalışabilir
2. **1500 Sonrası Kuralı**: 1500 vardiyasından sonra 918 vardiyası gelmemeli
3. **1322 Günlük Limiti**: Her gün maksimum 2 kişi 1322 vardiyasında olabilir
4. **Dengeli Dağıtım**: 918 ve 1500 vardiyaları kişilere dengeli dağıtılır

### Manuel Düzenleme

- Program tablosundaki herhangi bir hücreye tıklayarak vardiya atayabilirsiniz
- Vardiya seçim modalı açılır ve istediğiniz vardiyayı seçebilirsiniz
- Manuel vardiyaları (Rapor, Yıllık İzin, Ücretsiz İzin) istediğiniz zaman ekleyebilirsiniz

### Veri Yönetimi

- **localStorage**: Veriler tarayıcınızda otomatik olarak saklanır
- **Paylaşım**: Programı URL ile paylaşabilirsiniz (tüm veriler URL'de encode edilir)
- **Export/Import**: Programı JSON dosyası olarak kaydedip yükleyebilirsiniz

### Kural Kontrolü ve Uyarılar

Uygulama, programdaki kural ihlallerini otomatik olarak tespit eder ve uyarı gösterir:
- Haftalık çalışma günü limiti aşımı
- 1500 sonrası 918 vardiyası
- 1322 günlük limit aşımı

## Kullanım

1. **Takım Oluşturma**: "Yeni Takım" butonuna tıklayın ve takım adını girin
2. **Kişi Ekleme**: Takım seçtikten sonra kişi adını girip "Kişi Ekle" butonuna tıklayın
3. **Tarih Seçimi**: Başlangıç ve bitiş tarihlerini seçin
4. **Program Oluşturma**: "Otomatik Oluştur" butonuna tıklayın veya manuel olarak hücrelere tıklayarak düzenleyin
5. **Paylaşma**: "Paylaş" butonuna tıklayarak linki kopyalayın ve paylaşın

## Teknik Detaylar

- **Teknoloji**: Vanilla JavaScript, HTML5, CSS3
- **Veri Depolama**: localStorage (tarayıcı)
- **Paylaşım**: URL parametreleri (base64 encode)
- **Dosya Formatı**: JSON

## Tarayıcı Desteği

Modern tarayıcıların tümünde çalışır:
- Chrome
- Firefox
- Safari
- Edge

## Notlar

- Veriler sadece tarayıcınızda saklanır, sunucuya gönderilmez
- Paylaşım linkleri tüm program verilerini içerir
- Export edilen JSON dosyalarını yedek olarak saklayabilirsiniz

