#!/usr/bin/env bash
set -euo pipefail

# Uso:
#   ./n8n_backup_restore.sh backup
#   ./n8n_backup_restore.sh restore /caminho/arquivo.tar.gz
#
# Variáveis opcionais:
#   COMPOSE_FILE=/root/docker-compose.yml
#   PROJECT_DIR=/root
#   BACKUP_DIR=/root/backups

ACTION="${1:-}"

COMPOSE_FILE="${COMPOSE_FILE:-/root/docker-compose.yml}"
PROJECT_DIR="${PROJECT_DIR:-/root}"
BACKUP_DIR="${BACKUP_DIR:-/root/backups}"

# Nome do volume do n8n (pelo seu print, existe "n8n_data" e "root_n8n_data")
# O script tenta achar automaticamente.
pick_volume() {
  local candidates=("n8n_data" "root_n8n_data")
  for v in "${candidates[@]}"; do
    if docker volume inspect "$v" >/dev/null 2>&1; then
      echo "$v"
      return 0
    fi
  done
  # fallback: tenta achar qualquer volume que contenha "n8n" e "data"
  local v2
  v2="$(docker volume ls --format '{{.Name}}' | grep -Ei 'n8n.*data|data.*n8n' | head -n 1 || true)"
  if [[ -n "${v2}" ]]; then
    echo "$v2"
    return 0
  fi
  echo "ERRO: não encontrei volume do n8n (n8n_data/root_n8n_data)." >&2
  exit 1
}

ensure_dirs() {
  mkdir -p "$BACKUP_DIR"
}

compose_down_only_n8n() {
  # derruba apenas n8n/traefik/postgres se você quiser; aqui mantemos simples:
  # se você usa tudo no mesmo compose /root/docker-compose.yml, use "docker compose down"
  # Mas para não derrubar seu api-alma, vamos parar só o n8n.
  # Se seu compose tem serviço "n8n", isso funciona.
  docker compose -f "$COMPOSE_FILE" stop n8n >/dev/null 2>&1 || true
}

compose_up_n8n() {
  docker compose -f "$COMPOSE_FILE" up -d n8n >/dev/null 2>&1 || true
}

do_backup() {
  ensure_dirs
  local volume
  volume="$(pick_volume)"

  local ts
  ts="$(date +%Y-%m-%d_%H%M%S)"
  local out="${BACKUP_DIR}/n8n_volume_${volume}_${ts}.tar.gz"

  echo "==> Backup do volume: ${volume}"
  echo "==> Arquivo: ${out}"

  # Para garantir consistência do sqlite (se estiver usando sqlite), pare o n8n antes.
  compose_down_only_n8n

  docker run --rm \
    -v "${volume}:/data:ro" \
    -v "${BACKUP_DIR}:/backup" \
    alpine sh -lc "cd /data && tar -czf /backup/$(basename "$out") ."

  # Sobe n8n de volta
  compose_up_n8n

  echo "OK: Backup criado em: ${out}"
}

do_restore() {
  local file="${2:-}"
  if [[ -z "${file}" ]]; then
    echo "Uso: $0 restore /caminho/arquivo.tar.gz" >&2
    exit 1
  fi
  if [[ ! -f "${file}" ]]; then
    echo "ERRO: arquivo não encontrado: ${file}" >&2
    exit 1
  fi

  local volume
  volume="$(pick_volume)"

  echo "==> Restore no volume: ${volume}"
  echo "==> Do arquivo: ${file}"
  echo "ATENÇÃO: isso sobrescreve o conteúdo do volume."

  # Para consistência, pare n8n
  compose_down_only_n8n

  # Limpa o volume
  docker run --rm -v "${volume}:/data" alpine sh -lc "rm -rf /data/*"

  # Restaura
  docker run --rm \
    -v "${volume}:/data" \
    -v "$(dirname "$file"):/backup" \
    alpine sh -lc "cd /data && tar -xzf /backup/$(basename "$file")"

  # Sobe n8n de volta
  compose_up_n8n

  echo "OK: Restore concluído."
}

case "$ACTION" in
  backup)  do_backup ;;
  restore) do_restore "$@" ;;
  *)
    echo "Uso:"
    echo "  $0 backup"
    echo "  $0 restore /caminho/arquivo.tar.gz"
    echo ""
    echo "Vars opcionais:"
    echo "  COMPOSE_FILE=/root/docker-compose.yml BACKUP_DIR=/root/backups $0 backup"
    exit 1
  ;;
esac
