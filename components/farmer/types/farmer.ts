export interface Farmer {
  fullName: string;
  email: string;
  phone: string;

  // 🔥 ADD THIS FIELD
  upiId?: string;     

  farm: {
    size: number;
    unit: string;
    location: string;
    memberSince?: string;
  };

  cropsGrown: string[];
  role: "farmer";     // must stay literal type
}
