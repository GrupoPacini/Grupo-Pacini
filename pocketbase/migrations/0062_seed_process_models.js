migrate(
  (app) => {
    var modelsCol = app.findCollectionByNameOrId('process_models')
    var stagesCol = app.findCollectionByNameOrId('process_model_stages')
    var tasksCol = app.findCollectionByNameOrId('process_model_tasks')

    try {
      app.findFirstRecordByData('process_models', 'name', 'Abertura de Empresa')
      return
    } catch (_) {}

    var model = new Record(modelsCol)
    model.set('name', 'Abertura de Empresa')
    model.set(
      'description',
      'Modelo completo para abertura de nova empresa com todas as etapas necessárias',
    )
    model.set('type', 'eventual')
    model.set('status', 'ativo')
    app.save(model)

    var stagesData = [
      {
        name: 'Coleta de informações',
        order: 0,
        tasks: [
          {
            name: 'Coletar documentos do sócio',
            desc: 'RG, CPF, comprovante de residência',
            days: 2,
            req: 'sim',
            order: 0,
          },
          {
            name: 'Verificar comprovante de endereço',
            desc: 'Validar comprovante atualizado',
            days: 1,
            req: 'sim',
            order: 1,
          },
        ],
      },
      {
        name: 'Viabilidade',
        order: 1,
        tasks: [
          {
            name: 'Análise de viabilidade municipal',
            desc: 'Verificar exigências do município',
            days: 3,
            req: 'sim',
            order: 0,
          },
          {
            name: 'Verificação de nome empresarial',
            desc: 'Checar disponibilidade do nome',
            days: 1,
            req: 'não',
            order: 1,
          },
        ],
      },
      {
        name: 'Contrato Social',
        order: 2,
        tasks: [
          {
            name: 'Elaborar contrato social',
            desc: 'Redigir contrato conforme tipo societário',
            days: 2,
            req: 'sim',
            order: 0,
          },
          {
            name: 'Revisão e assinatura',
            desc: 'Revisar e coletar assinaturas',
            days: 1,
            req: 'sim',
            order: 1,
          },
        ],
      },
      {
        name: 'Receita Federal',
        order: 3,
        tasks: [
          {
            name: 'Obter CNPJ',
            desc: 'Protocolar solicitação de CNPJ',
            days: 3,
            req: 'sim',
            order: 0,
          },
          {
            name: 'Cadastramento no SINTEGRA',
            desc: 'Realizar inscrição estadual se aplicável',
            days: 2,
            req: 'não',
            order: 1,
          },
        ],
      },
      {
        name: 'Junta Comercial',
        order: 4,
        tasks: [
          {
            name: 'Protocolar contrato social',
            desc: 'Apresentar documentos na junta',
            days: 5,
            req: 'sim',
            order: 0,
          },
          {
            name: 'Acompanhar protocolo',
            desc: 'Monitorar andamento',
            days: 3,
            req: 'não',
            order: 1,
          },
        ],
      },
      {
        name: 'Prefeitura',
        order: 5,
        tasks: [
          {
            name: 'Alvará de funcionamento',
            desc: 'Solicitar alvará de localização',
            days: 5,
            req: 'sim',
            order: 0,
          },
          {
            name: 'Inscrição municipal',
            desc: 'Realizar cadastro municipal',
            days: 2,
            req: 'sim',
            order: 1,
          },
        ],
      },
      {
        name: 'Licenciamento',
        order: 6,
        tasks: [
          {
            name: 'Licença sanitária (se aplicável)',
            desc: 'Verificar necessidade de licença sanitária',
            days: 7,
            req: 'não',
            order: 0,
          },
          {
            name: 'Licença do corpo de bombeiros',
            desc: 'AVCB - Auto de Vistoria do Corpo de Bombeiros',
            days: 5,
            req: 'não',
            order: 1,
          },
        ],
      },
      {
        name: 'Conclusão',
        order: 7,
        tasks: [
          {
            name: 'Entrega de documentos ao cliente',
            desc: 'Entregar todo o kit documental',
            days: 1,
            req: 'sim',
            order: 0,
          },
          {
            name: 'Arquivamento documental',
            desc: 'Arquivar cópias no sistema',
            days: 1,
            req: 'sim',
            order: 1,
          },
        ],
      },
    ]

    for (var i = 0; i < stagesData.length; i++) {
      var sd = stagesData[i]
      var stage = new Record(stagesCol)
      stage.set('model', model.id)
      stage.set('name', sd.name)
      stage.set('order', sd.order)
      app.save(stage)

      for (var j = 0; j < sd.tasks.length; j++) {
        var td = sd.tasks[j]
        var task = new Record(tasksCol)
        task.set('stage', stage.id)
        task.set('name', td.name)
        task.set('description', td.desc)
        task.set('default_due_days', td.days)
        task.set('required', td.req)
        task.set('order', td.order)
        app.save(task)
      }
    }
  },
  (app) => {
    try {
      var model = app.findFirstRecordByData('process_models', 'name', 'Abertura de Empresa')
      app.delete(model)
    } catch (_) {}
  },
)
