export interface Farmer {
  fullName: string
  email: string
  phone: string
  role: "farmer"
  cropsGrown: string[]
  farm: {
    size: number
    unit: string
    location: string
    memberSince: string
  }
  createdAt?: any
  updatedAt?: any
}
