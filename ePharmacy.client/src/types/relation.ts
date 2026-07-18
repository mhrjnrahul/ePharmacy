export type RelationType = "side_effect_companion" | "frequently_bought_together"

export interface MedicineRelation {
  id: string
  from_medicine: string
  from_medicine_name: string
  to_medicine: string
  to_medicine_name: string
  relation_type: RelationType
  weight: number
}

export interface CreateRelationRequest {
  // The backend's MedicineRelationSerializer requires from_medicine as an
  // input field even though the list-create view also injects it from the
  // URL — the URL value wins server-side, but the field still has to be
  // present for the serializer's own validation to pass.
  from_medicine: string
  to_medicine: string
  relation_type: RelationType
  weight: number
}
