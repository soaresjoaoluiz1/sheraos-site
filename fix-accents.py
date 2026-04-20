#!/usr/bin/env python3
"""Aplica acentuação portuguesa em arquivos HTML/MD da Sheraos."""
import sys
import re
from pathlib import Path

# Substituições em ordem de especificidade (mais longas primeiro)
REPLACEMENTS = [
    # Substantivos comuns
    ('estratégia', 'estratégia'),  # placeholder pra não quebrar
    # === Palavras completas (case-sensitive) ===
    # ação/ções
    ('execucao', 'execução'), ('Execucao', 'Execução'),
    ('otimizacao', 'otimização'), ('Otimizacao', 'Otimização'), ('otimizacoes', 'otimizações'),
    ('automacao', 'automação'), ('Automacao', 'Automação'), ('automacoes', 'automações'),
    ('integracao', 'integração'), ('Integracao', 'Integração'), ('integracoes', 'integrações'),
    ('informacao', 'informação'), ('Informacao', 'Informação'), ('informacoes', 'informações'),
    ('comunicacao', 'comunicação'), ('Comunicacao', 'Comunicação'),
    ('operacao', 'operação'), ('Operacao', 'Operação'),
    ('qualificacao', 'qualificação'), ('Qualificacao', 'Qualificação'),
    ('criacao', 'criação'), ('Criacao', 'Criação'),
    ('gravacao', 'gravação'), ('Gravacao', 'Gravação'),
    ('edicao', 'edição'), ('Edicao', 'Edição'),
    ('producao', 'produção'), ('Producao', 'Produção'),
    ('distribuicao', 'distribuição'), ('Distribuicao', 'Distribuição'),
    ('aplicacao', 'aplicação'), ('Aplicacao', 'Aplicação'),
    ('solucao', 'solução'), ('Solucao', 'Solução'),
    ('solucoes', 'soluções'), ('Solucoes', 'Soluções'),
    ('conversao', 'conversão'), ('Conversao', 'Conversão'),
    ('conversoes', 'conversões'), ('Conversoes', 'Conversões'),
    ('decisao', 'decisão'), ('Decisao', 'Decisão'),
    ('questao', 'questão'), ('Questao', 'Questão'),
    ('intencao', 'intenção'), ('Intencao', 'Intenção'), ('intencoes', 'intenções'),
    ('atencao', 'atenção'), ('Atencao', 'Atenção'),
    ('satisfacao', 'satisfação'), ('Satisfacao', 'Satisfação'),
    ('avaliacao', 'avaliação'), ('Avaliacao', 'Avaliação'), ('avaliacoes', 'avaliações'),
    ('configuracao', 'configuração'), ('Configuracao', 'Configuração'), ('configuracoes', 'configurações'),
    ('colaboracao', 'colaboração'), ('Colaboracao', 'Colaboração'),
    ('demonstracao', 'demonstração'),
    ('contratacao', 'contratação'), ('Contratacao', 'Contratação'),
    ('captacao', 'captação'), ('Captacao', 'Captação'),
    ('acao', 'ação'), ('Acao', 'Ação'),
    ('acoes', 'ações'), ('Acoes', 'Ações'),
    ('reuniao', 'reunião'), ('Reuniao', 'Reunião'),
    ('reunioes', 'reuniões'),
    ('expressao', 'expressão'),
    # ê/é/á
    ('voce', 'você'), ('Voce', 'Você'), ('VOCE', 'VOCÊ'),
    ('voces', 'vocês'),
    ('ja ', 'já '), ('Ja ', 'Já '),
    (' ate ', ' até '), (' Ate ', ' Até '), ('Ate ', 'Até '),
    ('milhoes', 'milhões'), ('Milhoes', 'Milhões'),
    # Palavras com ç
    ('presenca', 'presença'), ('Presenca', 'Presença'),
    ('servico', 'serviço'), ('Servico', 'Serviço'), ('servicos', 'serviços'), ('Servicos', 'Serviços'),
    ('negocio', 'negócio'), ('Negocio', 'Negócio'), ('negocios', 'negócios'),
    ('comercio', 'comércio'),
    ('cadencia', 'cadência'), ('cadencias', 'cadências'),
    # Adjetivos
    ('proprio', 'próprio'), ('Proprio', 'Próprio'), ('proprios', 'próprios'),
    ('propria', 'própria'), ('Propria', 'Própria'), ('proprias', 'próprias'),
    ('tambem', 'também'), ('Tambem', 'Também'),
    ('possivel', 'possível'), ('Possivel', 'Possível'),
    ('previsivel', 'previsível'), ('Previsivel', 'Previsível'),
    ('escalavel', 'escalável'), ('escalaveis', 'escaláveis'),
    ('rapido', 'rápido'), ('Rapido', 'Rápido'),
    ('rapida', 'rápida'), ('Rapida', 'Rápida'),
    ('rapidas', 'rápidas'),
    ('facil', 'fácil'), ('Facil', 'Fácil'),
    ('faceis', 'fáceis'), ('Faceis', 'Fáceis'),
    ('dificil', 'difícil'), ('Dificil', 'Difícil'),
    ('dificeis', 'difíceis'), ('Dificeis', 'Difíceis'),
    ('unico', 'único'), ('Unico', 'Único'),
    ('unica', 'única'), ('Unica', 'Única'),
    ('ultimo', 'último'), ('Ultimo', 'Último'),
    ('ultima', 'última'), ('Ultima', 'Última'),
    ('maximo', 'máximo'), ('Maximo', 'Máximo'),
    ('minimo', 'mínimo'), ('Minimo', 'Mínimo'),
    ('otimo', 'ótimo'), ('Otimo', 'Ótimo'),
    ('otima', 'ótima'), ('Otima', 'Ótima'),
    ('proximo', 'próximo'), ('Proximo', 'Próximo'),
    ('proxima', 'próxima'), ('Proxima', 'Próxima'),
    ('proximos', 'próximos'), ('proximas', 'próximas'),
    ('publico', 'público'), ('Publico', 'Público'),
    ('publica', 'pública'),
    ('pratico', 'prático'), ('Pratico', 'Prático'),
    ('pratica', 'prática'), ('Pratica', 'Prática'),
    ('praticas', 'práticas'),
    ('tipico', 'típico'), ('Tipico', 'Típico'),
    ('basica', 'básica'),
    ('basicas', 'básicas'),
    ('basico', 'básico'),
    ('basicos', 'básicos'),
    ('tecnologica', 'tecnológica'),
    ('tecnologico', 'tecnológico'),
    ('organico', 'orgânico'), ('Organico', 'Orgânico'),
    ('organica', 'orgânica'),
    ('dinamico', 'dinâmico'),
    ('dinamica', 'dinâmica'),
    ('metrica', 'métrica'), ('Metrica', 'Métrica'),
    ('metricas', 'métricas'), ('Metricas', 'Métricas'),
    # Substantivos técnicos
    ('metodo', 'método'), ('Metodo', 'Método'), ('METODO', 'MÉTODO'),
    ('diagnostico', 'diagnóstico'), ('Diagnostico', 'Diagnóstico'),
    ('analise', 'análise'), ('Analise', 'Análise'),
    ('analises', 'análises'),
    ('relatorio', 'relatório'), ('Relatorio', 'Relatório'),
    ('relatorios', 'relatórios'),
    ('escritorio', 'escritório'),
    ('calendario', 'calendário'), ('Calendario', 'Calendário'),
    ('referencia', 'referência'), ('Referencia', 'Referência'),
    ('referencias', 'referências'),
    ('familia', 'família'), ('Familia', 'Família'),
    ('midia', 'mídia'), ('Midia', 'Mídia'),
    ('midias', 'mídias'),
    ('pagina', 'página'), ('Pagina', 'Página'),
    ('paginas', 'páginas'), ('Paginas', 'Páginas'),
    ('area', 'área'), ('Area', 'Área'),
    ('areas', 'áreas'),
    ('periodico', 'periódico'), ('periodica', 'periódica'),
    # "Não"
    ('Nao ', 'Não '), ('nao ', 'não '), ('NAO ', 'NÃO '),
    # "São"
    ('sao ', 'são '), ('Sao ', 'São '),
    # "duvidas"
    ('duvida', 'dúvida'), ('Duvida', 'Dúvida'),
    ('duvidas', 'dúvidas'), ('Duvidas', 'Dúvidas'),
    # Estratégia etc
    ('estrategia', 'estratégia'), ('Estrategia', 'Estratégia'), ('ESTRATEGIA', 'ESTRATÉGIA'),
    ('estrategico', 'estratégico'), ('Estrategico', 'Estratégico'),
    ('estrategica', 'estratégica'), ('Estrategica', 'Estratégica'),
    # Conteúdo
    ('conteudo', 'conteúdo'), ('Conteudo', 'Conteúdo'), ('CONTEUDO', 'CONTEÚDO'),
    ('conteudos', 'conteúdos'),
    # Veículos / Clientes
    ('Veiculos', 'Veículos'), ('veiculos', 'veículos'),
    # Outros
    (' e e', ' e é'),  # "e é" se aparecer
]


def fix_text(content: str) -> str:
    """Aplica as substituições no conteúdo."""
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    return content


def main():
    if len(sys.argv) < 2:
        print("Uso: python fix-accents.py <arquivo1> [arquivo2 ...]")
        sys.exit(1)

    for fname in sys.argv[1:]:
        path = Path(fname)
        if not path.exists():
            print(f"SKIP (nao existe): {fname}")
            continue
        try:
            content = path.read_text(encoding='utf-8')
            original_size = len(content)
            new_content = fix_text(content)
            if new_content != content:
                path.write_text(new_content, encoding='utf-8')
                diff = len(new_content) - original_size
                print(f"OK: {fname} (+{diff} bytes)")
            else:
                print(f"-- {fname} (nenhuma mudanca)")
        except Exception as e:
            print(f"ERRO: {fname} - {e}")


if __name__ == '__main__':
    main()
