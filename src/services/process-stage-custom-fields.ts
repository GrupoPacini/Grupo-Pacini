import pb from '@/lib/pocketbase/client'

export interface ProcessStageCustomField {
  id: string
  stage: string
  label: string
  field_type: string
  options: string[] | null
  value: string
  order: number
  created: string
  updated: string
}

export const getCustomFieldsByStage = (stageId: string) =>
  pb.collection<ProcessStageCustomField>('process_stage_custom_fields').getFullList({
    filter: `stage = '${stageId}'`,
    sort: 'order',
  })

export const createCustomField = (data: {
  stage: string
  label: string
  field_type: string
  options?: string[] | null
  value?: string
  order?: number
}) => pb.collection<ProcessStageCustomField>('process_stage_custom_fields').create(data)

export const updateCustomField = (
  id: string,
  data: Partial<{
    label: string
    field_type: string
    options: string[] | null
    value: string
    order: number
  }>,
) => pb.collection<ProcessStageCustomField>('process_stage_custom_fields').update(id, data)

export const deleteCustomField = (id: string) =>
  pb.collection<ProcessStageCustomField>('process_stage_custom_fields').delete(id)
