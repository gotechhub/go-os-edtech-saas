# AWS S3 kurulum paketi

Bu klasör canlı AWS hesabına otomatik uygulanmış değildir. `vercel-oidc-roles.yaml`, Vercel proje/ortamına sabitlenen uygulama rolü ile ayrı HQ provisioning rolünü oluşturur. Önce mesajlaşma kanallarında paylaşılmış kalıcı IAM anahtarları iptal edilmelidir.

Uygulama sırası:

1. AWS hesabında mevcut sistem bucket'ının bölge, sahiplik, Block Public Access, versioning, şifreleme, TLS bucket policy, CORS ve lifecycle durumu salt okunur denetlenir.
2. CloudFormation şablonu gerçek Vercel team slug ve proje adıyla change set olarak açılır; güvenlik incelemesinden sonra uygulanır.
3. Çıktıdaki `ApplicationRoleArn`, Vercel Production ve Preview ortamlarına `AWS_ROLE_ARN` olarak girilir. Kalıcı access key girilmez.
4. Tenant provisioning worker rolü, HQ komutuna bağlı idempotent işi yürütür. Bucket güvenlik kontrolleri başarılı olmadan `v3_storage.locations.status = active` yapılmaz.
5. Sistem asset manifesti önce `scripts/push-s3-assets.ps1` ile dry-run, sonra geçici AWS oturumuyla `-Apply` çalıştırılır.

CloudFront, malware taraması ve tenant provisioning worker canlı kabul kanıtları ayrı sürüm kapılarıdır. Bu şablon mevcut bucket'ı sahiplenmez veya silmez.
