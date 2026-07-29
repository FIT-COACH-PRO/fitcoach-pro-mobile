> **RASCUNHO — NÃO PUBLICAR SEM REVISÃO JURÍDICA.**
> Este documento foi gerado a partir do inventário técnico real do projeto
> (schema do banco, código de coleta e integrações). Não substitui análise de
> um advogado especializado em LGPD, especialmente por envolver dado sensível
> de saúde de terceiros (alunos). Campos entre `[colchetes]` precisam ser
> preenchidos antes de publicar.

# Política de Privacidade — FitCoach Pro

Última atualização: [data]

## 1. Quem somos

O FitCoach Pro é um aplicativo para personal trainers gerenciarem seus
alunos, treinos, agenda e pagamentos. É operado por [nome/CNPJ do
responsável pelo app]. Contato: [e-mail de contato do controlador/operador —
ex.: privacidade@fitcoachpro.app].

## 2. Papéis: quem é o titular dos dados

Este ponto é importante e incomum o suficiente para merecer destaque: o
FitCoach Pro tem apenas um tipo de usuário com conta e login — o **personal
trainer**. Os **alunos não criam conta, não fazem login e não acessam o
aplicativo**. Os dados de alunos são inseridos e mantidos pelo próprio
personal, como parte da gestão do seu negócio.

Na prática da LGPD: o **personal trainer é o controlador** dos dados dos
seus alunos (decide o que coletar e para quê); o **FitCoach Pro atua como
operador**, processando esses dados em nome do personal, sob as instruções
dele. Se você é aluno de um personal que usa o FitCoach Pro e quer exercer
seus direitos sobre seus dados (acesso, correção, exclusão), o primeiro
contato deve ser o seu personal trainer — nós apoiamos esse pedido enquanto
operadores.

## 3. Dados que coletamos

### 3.1 Do personal trainer (titular direto, cria a própria conta)
Nome completo, CPF, CREF, e-mail, WhatsApp/telefone, cidade, estado, data de
nascimento, foto de perfil.

### 3.2 Dos alunos (inseridos pelo personal, personal é controlador)
Nome, WhatsApp, e-mail, data de nascimento, gênero.

**Dados de saúde (categoria sensível, art. 11 da LGPD):** peso, altura,
objetivo, lesões, restrições físicas, observações de saúde, histórico de
anamnese (quando preenchido), avaliações físicas (medidas corporais,
dobras cutâneas), fotos de evolução física (quando essa função existir no
app).

### 3.3 Dados financeiros
Valor de mensalidade, datas de vencimento/pagamento, status e forma de
pagamento — referentes à relação comercial entre personal e aluno.

### 3.4 Dados técnicos
Token de notificação push do dispositivo do personal (para lembretes de
aula/pagamento).

## 4. Uso de inteligência artificial

O FitCoach Pro usa uma função do lado do servidor (Supabase Edge Function)
para gerar sugestões automáticas ("Insights de IA") sobre a evolução e
situação de um aluno, a pedido do personal. Para isso, um subconjunto dos
dados do aluno (nome, status, objetivo, lesões, restrições, observações,
peso, altura, informações de mensalidade) é enviado a um provedor externo de
inteligência artificial (**Anthropic, API Claude**) no momento em que o
personal solicita o insight.

- Esse envio acontece só quando o personal pede o insight, não continuamente.
- [Confirmar antes de publicar: a Anthropic declara, nos termos da API
  Claude, que não usa dados enviados via API para treinar seus modelos por
  padrão — mas essa afirmação precisa ser verificada nos termos vigentes no
  momento da publicação, não presumida.]
- Os dados enviados não incluem CPF, e-mail ou WhatsApp do aluno.

## 5. Com quem compartilhamos dados

- **Supabase** (Estados Unidos/infraestrutura cloud) — hospedagem do banco
  de dados, autenticação e armazenamento de arquivos (vídeos, fotos).
- **Anthropic** — processamento pontual para gerar insights de IA (seção 4).
- Não vendemos dados a terceiros. Não usamos dados para publicidade.

## 6. Por quanto tempo mantemos os dados

Enquanto a conta do personal estiver ativa. Se o personal solicitar o
encerramento da conta:

- Há um **período de carência de 30 dias**, durante o qual a conta continua
  funcionando normalmente e o pedido pode ser cancelado a qualquer momento.
- Encerrado o prazo: dados diretamente identificadores do personal e dos
  alunos são **anonimizados** (removemos nome, contato e informações de
  texto livre que possam identificar a pessoa). Fichas de saúde detalhadas
  (anamnese, avaliações físicas) e fotos de evolução são **apagadas**.
  Registros financeiros são **mantidos de forma anonimizada**, pelo tempo
  exigido pela legislação fiscal/contábil aplicável.

## 7. Seus direitos (LGPD)

Você pode solicitar, a qualquer momento: confirmação de que tratamos seus
dados, acesso aos dados, correção de dados incompletos ou desatualizados,
anonimização/exclusão de dados desnecessários ou tratados em desconformidade
com a lei, portabilidade, e informação sobre com quem compartilhamos seus
dados. Personal trainers podem exercer esses direitos diretamente pelo app
(exclusão de conta, em Configurações) ou pelo contato em [e-mail]. Alunos
devem procurar o personal responsável por seus dados.

## 8. Exclusão de conta

O personal pode solicitar o encerramento da própria conta a qualquer momento
pelo app, em Configurações → Excluir conta. Detalhes de retenção na seção 6.

## 9. Contato

Dúvidas sobre esta política ou sobre seus dados: [e-mail de contato].

## 10. Alterações desta política

Podemos atualizar esta política. Mudanças relevantes serão comunicadas no
app.
