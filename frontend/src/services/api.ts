// API service for communicating with FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Vendor {
  id: number;
  vendor: string;
  location: string;
  contact?: string;
  email?: string;
  url?: string;
  finalized: boolean;
  payment_status: string;
  delivery_status: string;
  notes?: string;
}

export interface VendorSearchParams {
  material: string;
  location?: string;
}

export interface VendorUpdateData {
  finalized?: boolean;
  payment_status?: string;
  delivery_status?: string;
  notes?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Search for vendors based on material and location
  async searchVendors(params: VendorSearchParams): Promise<Vendor[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('material', params.material);
    if (params.location) {
      searchParams.append('location', params.location);
    }

    return this.request<Vendor[]>(`/vendors?${searchParams.toString()}`);
  }

  // Finalize a vendor
  async finalizeVendor(vendorId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/vendors/finalize/${vendorId}`, {
      method: 'POST',
    });
  }

  // Update vendor information
  async updateVendor(vendorId: number, data: VendorUpdateData): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/vendors/${vendorId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Get all finalized vendors
  async getFinalizedVendors(): Promise<Vendor[]> {
    return this.request<Vendor[]>('/vendors/finalized');
  }

  // Health check
  async healthCheck(): Promise<{ message: string; version: string }> {
    return this.request<{ message: string; version: string }>('/');
  }
}

export const apiService = new ApiService();
export default apiService;
