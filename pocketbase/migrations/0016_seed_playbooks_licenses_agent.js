migrate(
  (app) => {
    const pbCol = app.findCollectionByNameOrId('playbooks')
    let deptContabil = ''
    let deptFiscal = ''
    try {
      deptContabil = app.findFirstRecordByData('departments', 'name', 'Contábil').id
    } catch (_) {}
    try {
      deptFiscal = app.findFirstRecordByData('departments', 'name', 'Fiscal').id
    } catch (_) {}

    const playbookData = [
      {
        title: 'Abertura de Empresa',
        content:
          'Procedimento completo para abertura de empresa:\n1. Consulta de viabilidade do nome empresarial\n2. Documentacao dos socios (RG, CPF, comprovante de residencia)\n3. Elaboracao do Contrato Social\n4. Registro na Junta Comercial\n5. Inscricao Estadual e Municipal\n6. Alvara de Funcionamento\n7. Obtendo o CNPJ na Receita Federal\n8. Cadastro no Simples Nacional ou outro regime tributario',
        department: deptContabil,
      },
      {
        title: 'Fechamento Mensal',
        content:
          'Guia de fechamento contabil mensal:\n1. Conciliacao bancaria de todas as contas\n2. Conferencia de notas fiscais de entrada e saida\n3. Apuracao de impostos (ICMS, PIS, COFINS, ISS)\n4. Calculo da folha de pagamento e encargos\n5. Encerramento do periodo e emissao de balancete\n6. Entrega de obrigacoes acessorias (DCTF, SPED, EFD)\n7. Envio de relatorios gerenciais ao cliente',
        department: deptContabil,
      },
      {
        title: 'Gestao de Certificados',
        content:
          'Como gerenciar certificados digitais:\n1. Monitorar validade de todos os certificados (renovar 30 dias antes do vencimento)\n2. Manter backup seguro das chaves privadas\n3. Controlar acesso por usuario e departamento\n4. Documentar tipo (A1, A3, e-CNPJ, e-CPF)\n5. Notificar responsaveis sobre expiracao iminente\n6. Manter registro de revogacoes e substituicoes',
        department: deptFiscal,
      },
    ]

    for (const data of playbookData) {
      try {
        app.findFirstRecordByData('playbooks', 'title', data.title)
      } catch (_) {
        const r = new Record(pbCol)
        r.set('title', data.title)
        r.set('content', data.content)
        r.set('department', data.department)
        app.save(r)
      }
    }

    const licCol = app.findCollectionByNameOrId('licenses')
    try {
      const client = app.findFirstRecordByData('clients', 'name', 'Tech Solutions Ltda')
      const soon = new Date()
      soon.setDate(soon.getDate() + 15)
      const later = new Date()
      later.setDate(later.getDate() + 180)

      const licenseData = [
        {
          name: 'Certificado Digital A1',
          type: 'Certificado Digital',
          expiration_date: soon.toISOString().split('T')[0],
          status: 'Ativo',
        },
        {
          name: 'Licenca Conta Azul',
          type: 'Software',
          expiration_date: later.toISOString().split('T')[0],
          status: 'Ativo',
        },
      ]

      if (app.countRecords('licenses') === 0) {
        for (const data of licenseData) {
          const r = new Record(licCol)
          r.set('client', client.id)
          r.set('name', data.name)
          r.set('type', data.type)
          r.set('expiration_date', data.expiration_date)
          r.set('status', data.status)
          app.save(r)
        }
      }
    } catch (_) {}

    $ai.agents.define(app, {
      slug: 'pacini-specialist',
      name: 'Pacini Specialist',
      description: 'Consultor contabil especializado nos procedimentos internos do Grupo Pacini.',
      systemPrompt:
        'Voce e um consultor contabil profissional e prestativo do Grupo Pacini. Responda perguntas baseando-se nos playbooks e procedimentos internos da empresa. Cite as fontes usando tags [n]. Se a pergunta estiver fora do escopo, diga que nao possui essa informacao.',
      tier: 'fast',
      tools: [
        { collection: 'playbooks', perms: { read: true, list: true } },
        { collection: 'processes', perms: { read: true, list: true } },
        { collection: 'clients', perms: { read: true, list: true } },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'Abertura de Empresa: O procedimento inclui: 1) Consulta de viabilidade do nome, 2) Documentacao do socio (RG, CPF, comprovante de residencia), 3) Contrato Social, 4) Registro na Junta Comercial, 5) Inscricao Estadual e Municipal, 6) Alvara de Funcionamento, 7) CNPJ na Receita Federal. Para MEI, o processo e simplificado via Portal do Empreendedor.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Fechamento Mensal: Inclui conciliacao bancaria, conferencia de notas fiscais, apuracao de impostos (ICMS, PIS, COFINS), calculo de folha, encerramento e balancete, entrega de obrigacoes acessorias (DCTF, SPED, EFD).',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Gestao de Certificados: Monitorar validade (renovar 30 dias antes), backup de chaves, controle de acesso, documentar tipo (A1, A3, e-CNPJ), notificar responsaveis sobre expiracao.',
          },
        },
      ],
    })
  },
  (app) => {
    $ai.agents.delete(app, 'pacini-specialist')
  },
)
