# Deploy — Sheraos Marketing

## VPS
- **IP**: 187.127.25.160
- **OS**: Ubuntu 24.04 LTS
- **Traefik**: ja rodando (portas 80/443 com SSL automatico Let's Encrypt)
- **Dominio**: sheraos.com.br (precisa apontar pra IP da VPS)

## Arquitetura

```
Usuario → sheraos.com.br → Traefik (SSL) → container sheraos-web (Nginx) → HTMLs
```

## 1 x — Primeira instalacao

### Passo 1: apontar o DNS pra VPS
Na hospedagem onde o dominio sheraos.com.br esta registrado, crie/edite os registros **A**:

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | 187.127.25.160 |
| A | www | 187.127.25.160 |

Remova qualquer registro A/AAAA antigo apontando pra hospedagem atual.

Verificar propagacao: `dig sheraos.com.br +short`

### Passo 2: clonar o repo na VPS
```bash
ssh root@187.127.25.160
mkdir -p /opt/sites
cd /opt/sites
git clone https://github.com/SEU_USER/sheraos-marketing.git
cd sheraos-marketing
```

### Passo 3: subir o container
```bash
docker compose up -d
docker compose logs -f  # pra acompanhar
```

Traefik vai detectar o container automaticamente via labels e:
- Gerar certificado SSL Let's Encrypt
- Rotear sheraos.com.br → nginx (porta 80 do container)
- Redirecionar HTTP → HTTPS
- Redirecionar www → sem www

Aguarde ~1-2 minutos pro SSL ser emitido.

Pronto, acessa `https://sheraos.com.br`.

## Atualizacoes futuras (workflow de dev)

### No seu PC (local)
```bash
# editar arquivos...
git add .
git commit -m "update: mensagem da mudanca"
git push origin main
```

### Na VPS
```bash
ssh root@187.127.25.160
cd /opt/sites/sheraos-marketing
git pull
# arquivos sao servidos direto (volume montado), nao precisa rebuildar
# se mudou docker-compose.yml ou nginx.conf:
docker compose up -d --force-recreate
```

## Deploy automatico (opcional)

Crie `.github/workflows/deploy.yml` pra fazer git pull automatico a cada push:

```yaml
name: Deploy to VPS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: 187.127.25.160
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/sites/sheraos-marketing
            git pull
```

(Precisa adicionar a chave SSH privada como secret `SSH_PRIVATE_KEY` no GitHub)

## Troubleshooting

### Site nao abre (timeout)
- DNS ainda propagando? `dig sheraos.com.br` deve retornar `187.127.25.160`
- Traefik esta rodando? `docker ps | grep traefik`
- Container do site esta UP? `docker ps | grep sheraos`

### SSL nao emite (erro certificado)
- Let's Encrypt tem rate limit. Se errou, aguarde 1h antes de tentar de novo.
- Ver logs: `docker logs traefik-traefik-1 | tail -50`
- Certifique que DNS ja propagou ANTES de ligar o container (senao da erro de validacao)

### Atualizar conteudo (HTML) nao aparece
- Hard refresh no browser (Ctrl+F5)
- Volume esta montado como `.:/usr/share/nginx/html` entao arquivos sao servidos direto
- Se quiser forcar restart: `docker compose restart`
