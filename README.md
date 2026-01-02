# Team MCP Server

A centralized MCP server designed to assist the entire software team.

## Features & Capabilities

### 🧰 Developer Tools
Günlük kodlama ve git operasyonları için araçlar.
- **`sb_backend_dev_git_status`**: Mevcut git deposunun durumunu gösterir.
- **`sb_backend_dev_scaffold_project`**: Temel yapıya sahip yeni bir proje iskeleti oluşturur.
- **`sb_backend_dev_git_create_branch`**: Yeni bir branch oluşturur ve o branch'e geçer.
- **`sb_backend_dev_git_commit`**: Değişiklikleri stage eder ve commit atar.
- **`sb_backend_dev_git_push`**: Commitleri uzak sunucuya (remote) gönderir.
- **`sb_backend_git_log`**: Commit geçmişini görüntüler.
- **`sb_backend_git_diff`**: Değişiklikleri (diff) gösterir.
- **`sb_backend_git_show`**: Commit, tag vb. git objelerinin detaylarını gösterir.
- **`sb_backend_git_blame`**: Bir dosyanın satır bazlı değişiklik geçmişini gösterir.

### 📂 File System Tools (Dosya Sistemi)
Dosya sistemi üzerinde okuma/yazma işlemleri.
- **`sb_backend_fs_read_file`**: Dosya içeriğini okur.
- **`sb_backend_fs_write_file`**: Dosyaya içerik yazar (üzerine yazar).
- **`sb_backend_fs_list_directory`**: Klasör içeriğini listeler.
- **`sb_backend_fs_create_file`**: Yeni ve boş bir dosya oluşturur.
- **`sb_backend_fs_delete_file`**: Dosya siler.

### 🏗️ Build & CI Tools (Derleme ve Sürekli Entegrasyon)
Projeyi derleme, test etme ve CI süreçlerini yönetme.
- **`sb_backend_run_build`**: Build komutunu (`npm run build`) çalıştırır.
- **`sb_backend_run_unit_tests`**: Birim testleri (`npm test`) çalıştırır.
- **`sb_backend_run_integration_tests`**: Entegrasyon testlerini çalıştırır.
- **`sb_backend_run_command`**: Herhangi bir shell komutunu çalıştırır.
- **`sb_backend_read_application_logs`**: Log dosyalarının son satırlarını okur.
- **`sb_backend_read_ci_pipeline`**: CI konfigürasyon dosyasını (ör. `.gitlab-ci.yml`) okur.
- **`sb_backend_analyze_pipeline_failure`**: Başarısız pipeline loglarını analiz eder.
- **`sb_backend_scan_dependencies`**: Güvenlik taraması (`npm audit`) yapar.

### 🦊 GitLab Integration
GitLab projeleri, merge request'ler ve pipeline'lar ile etkileşim.
- **`sb_backend_gitlab_list_commits`**: Projenin son commitlerini listeler.
- **`sb_backend_gitlab_list_pipelines`**: Son pipeline'ları listeler.
- **`sb_backend_gitlab_pipeline_status`**: Belirli bir pipeline'ın durumunu getirir.
- **`sb_backend_gitlab_get_job_failure`**: Başarısız job'ların loglarını getirir.
- **`sb_backend_gitlab_create_merge_request`**: Yeni bir Merge Request (MR) oluşturur.
- **`sb_backend_gitlab_review_merge_request`**: Bir MR'ın detaylarını ve değişikliklerini getirir.
- **`sb_backend_gitlab_open_issue`**: Yeni bir GitLab issue açar.

### 🗄️ Database Tools (Veritabanı)
Veritabanı üzerinde salt okunur (read-only) işlemler.
- **`sb_backend_db_select_query`**: SQL SELECT sorgusu çalıştırır.
- **`sb_backend_db_describe_schema`**: Tablo şemasını (kolonlar, tipler) getirir.
- **`sb_backend_db_list_indexes`**: Tablo indexlerini listeler.
- **`sb_backend_db_explain_query`**: Bir sorgunun execution plan'ını (EXPLAIN) gösterir.

### ☸️ Kubernetes Tools (K8s)
Kubernetes kümesi ile etkileşim.
- **`sb_backend_k8s_list_pods`**: Podları listeler.
- **`sb_backend_k8s_get_logs`**: Pod loglarını getirir.
- **`sb_backend_k8s_describe_pod`**: Pod detaylarını gösterir.
- **`sb_backend_k8s_list_namespaces`**: Namespace'leri listeler.
- **`sb_backend_k8s_get_deployments`**: Deployment'ları listeler.
- **`sb_backend_k8s_get_services`**: Servisleri listeler.
- **`sb_backend_k8s_get_configmaps`**: ConfigMap'leri listeler.
- **`sb_backend_k8s_get_secrets_metadata`**: Secret'ların metadata bilgilerini listeler.

### 🎫 Jira Integration
Jira issue takibi ve yönetimi.
- **`sb_backend_jira_list_issues`**: JQL ile issue listeler.
- **`sb_backend_jira_create_issue`**: Yeni bir Jira issue (task/bug) oluşturur.
- **`sb_backend_jira_update_issue`**: Issue alanlarını günceller.
- **`sb_backend_jira_transition_issue`**: Issue statüsünü değiştirir.
- **`sb_backend_jira_assign_issue`**: Issue'yu bir kişiye atar.
- **`sb_backend_jira_comment_issue`**: Issue'ya yorum ekler.

### 📊 Instana (Monitoring)
Uygulama performansı ve izleme.
- **`sb_backend_instana_get_alerts`**: Aktif problemleri/alarmları listeler.
- **`sb_backend_instana_list_services`**: İzlenen servisleri listeler.
- **`sb_backend_instana_service_health`**: Servis sağlık durumunu ve metrik özetini getirir.
- **`sb_backend_instana_service_metrics`**: Spesifik metrikleri getirir.
- **`sb_backend_instana_service_traces`**: Servise ait trace'leri (izleri) getirir.
- **`sb_backend_instana_incident_list`**: Olay (incident) listesini getirir.
- **`sb_backend_instana_alert_details`**: Belirli bir alarmın detaylarını getirir.

### 🌐 API & Utility Tools
Genel HTTP istekleri ve yardımcı araçlar.
- **`sb_backend_http_request`**: Genel HTTP istekleri (GET, POST vb.) yapar.
- **`sb_backend_validate_api_response`**: JSON yanıtlarını şemaya göre doğrular.
- **`sb_backend_check_health_endpoint`**: Bir sağlık (health) endpoint'ini kontrol eder.
- **`sb_backend_sequential_thinking`**: Karmaşık problemleri adım adım çözmek için düşünme aracı.
- **`sb_backend_language_intelligence`**: Dil/Kod analizi ve formatlama yapar.
- **`sb_backend_code_refactor`**: Kod refactoring önerileri sunar.
- **`sb_backend_code_navigation`**: Kod içinde sembol (fonksiyon, sınıf) arar.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Run**
   ```bash
   npm start
   ```

## Configuration
Edit `src/index.ts` or tool files in `src/tools/` to customize behavior or connect to real services.
