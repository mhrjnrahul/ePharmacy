export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: {
    id: string
    first_name: string
    last_name: string
    role: "ADMIN" | "STAFF" | "CUSTOMER"
  }
}

export interface RegisterRequest {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface User {
  id: string        
  email: string    
  first_name: string
  last_name: string
  role: "ADMIN" | "STAFF" | "CUSTOMER"
  is_active? : boolean
}

export interface UserRead {
  id: string
  email: string
  first_name: string
  last_name: string
  role: "ADMIN" | "STAFF" | "CUSTOMER"
  is_active: boolean
}

export interface AdminCreateRequest {
  email: string
  first_name: string
  last_name: string
  password: string
  role: "ADMIN" | "STAFF" | "CUSTOMER"
}