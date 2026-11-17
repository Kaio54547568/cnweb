# infra

Hạ tầng cho môi trường dev (và sau này là file triển khai staging/production).

- `docker-compose.yml`: PostgreSQL 18 (cổng 5433) và Redis 7 (cổng 6380). Meilisearch chưa cần vì MVP tìm kiếm bằng PostgreSQL.

```bash
docker compose -f infra/docker-compose.yml up -d --wait
```
