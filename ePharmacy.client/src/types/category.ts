export interface Category {
    id: string,
    name: string,
    description: string,
    is_active: boolean,
    created_at: string
}

export interface CreateCategoryRequest {
  name: string
  description: string
  is_active: boolean
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {}