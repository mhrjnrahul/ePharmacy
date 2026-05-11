export interface Manufacturer {
  id: string
  name: string
  contact_info: string
  is_active: boolean
  created_at: string
}

export interface CreateManufacturerRequest {
  name: string
  contact_info: string
  is_active: boolean
}

export interface UpdateManufacturerRequest extends CreateManufacturerRequest {}