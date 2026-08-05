# Backup do site sheraos.com.br
Data: 2026-08-05
Commit no ar antes do refactor: 835f403

## Como restaurar (se precisar)
1. Copiar os arquivos deste backup pra raiz do projeto
2. `git add . && git commit -m "restore backup 2026-08-05"`
3. `git push origin main`
4. `ssh sheraos-locaweb "cd /opt/sites/sheraos-marketing && git pull"`

## O que foi mudado depois deste backup
Refatoração Sprint 01: home reorganizada em torno do Método Sheraos (6 fases). Ver relatorios/sheraos-estrategia-metodo.html pro documento diretor.
