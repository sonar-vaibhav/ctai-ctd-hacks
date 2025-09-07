// Mock data for the AI Procurement Management Platform

export interface Project {
  id: string;
  name: string;
  type: string;
  size: string;
  region: string;
  volume: number;
  status: 'active' | 'completed' | 'planning';
  createdAt: Date;
  timeline: {
    design: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
    development: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
    procurement: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
    installation: { start: Date; end: Date; status: 'completed' | 'in-progress' | 'pending' };
  };
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  category: string;
}

export interface Vendor {
  id: string;
  name: string;
  location: string;
  contact: string;
  email: string;
  materials: string[];
  rating: number;
}

export interface ProcurementItem {
  id: string;
  material: string;
  orderBy: Date;
  deliveryStart: Date;
  deliveryEnd: Date;
  status: 'critical' | 'warning' | 'on-track';
  vendor: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
}

// Mock projects data
export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Smart Office Building NYC',
    type: 'Commercial Construction',
    size: 'Large (>$10M)',
    region: 'North America',
    volume: 15000000,
    status: 'active',
    createdAt: new Date('2024-01-15'),
    timeline: {
      design: { start: new Date('2024-01-15'), end: new Date('2024-03-15'), status: 'completed' },
      development: { start: new Date('2024-03-16'), end: new Date('2024-05-30'), status: 'in-progress' },
      procurement: { start: new Date('2024-04-01'), end: new Date('2024-07-15'), status: 'pending' },
      installation: { start: new Date('2024-07-16'), end: new Date('2024-12-31'), status: 'pending' },
    },
  },
  {
    id: '2',
    name: 'Green Energy Data Center',
    type: 'Industrial Infrastructure',
    size: 'Medium ($1M-$10M)',
    region: 'Europe',
    volume: 5500000,
    status: 'planning',
    createdAt: new Date('2024-02-01'),
    timeline: {
      design: { start: new Date('2024-02-01'), end: new Date('2024-04-01'), status: 'in-progress' },
      development: { start: new Date('2024-04-02'), end: new Date('2024-06-15'), status: 'pending' },
      procurement: { start: new Date('2024-05-01'), end: new Date('2024-08-30'), status: 'pending' },
      installation: { start: new Date('2024-09-01'), end: new Date('2024-12-15'), status: 'pending' },
    },
  },
  {
    id: '3',
    name: 'Residential Complex Phase 1',
    type: 'Residential Development',
    size: 'Small (<$1M)',
    region: 'Asia Pacific',
    volume: 750000,
    status: 'completed',
    createdAt: new Date('2023-09-15'),
    timeline: {
      design: { start: new Date('2023-09-15'), end: new Date('2023-11-15'), status: 'completed' },
      development: { start: new Date('2023-11-16'), end: new Date('2024-01-31'), status: 'completed' },
      procurement: { start: new Date('2023-12-01'), end: new Date('2024-02-28'), status: 'completed' },
      installation: { start: new Date('2024-03-01'), end: new Date('2024-06-30'), status: 'completed' },
    },
  },
];

// Mock materials prediction data
export const mockMaterials: Material[] = [
  { id: '1', name: 'Structural Steel', quantity: 450, unit: 'tons', cost: 675000, category: 'Structure' },
  { id: '2', name: 'Concrete (High-grade)', quantity: 2800, unit: 'm³', cost: 420000, category: 'Foundation' },
  { id: '3', name: 'Glass Curtain Wall', quantity: 1200, unit: 'm²', cost: 960000, category: 'Exterior' },
  { id: '4', name: 'HVAC Systems', quantity: 24, unit: 'units', cost: 480000, category: 'MEP' },
  { id: '5', name: 'Electrical Conduits', quantity: 5500, unit: 'm', cost: 82500, category: 'Electrical' },
  { id: '6', name: 'Fire Safety Systems', quantity: 8, unit: 'systems', cost: 320000, category: 'Safety' },
  { id: '7', name: 'Insulation Materials', quantity: 3200, unit: 'm²', cost: 96000, category: 'Interior' },
  { id: '8', name: 'Plumbing Fixtures', quantity: 180, unit: 'units', cost: 126000, category: 'MEP' },
];

// Mock vendors data
export const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'SteelCorp Industries',
    location: 'Pittsburgh, PA',
    contact: '+1 (412) 555-0123',
    email: 'orders@steelcorp.com',
    materials: ['Structural Steel', 'Metal Frameworks'],
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Premium Concrete Co.',
    location: 'Chicago, IL',
    contact: '+1 (312) 555-0456',
    email: 'supply@premiumconcrete.com',
    materials: ['Concrete (High-grade)', 'Precast Elements'],
    rating: 4.6,
  },
  {
    id: '3',
    name: 'GlassTech Solutions',
    location: 'Seattle, WA',
    contact: '+1 (206) 555-0789',
    email: 'sales@glasstech.com',
    materials: ['Glass Curtain Wall', 'Windows', 'Glazing'],
    rating: 4.9,
  },
  {
    id: '4',
    name: 'Climate Systems Inc.',
    location: 'Dallas, TX',
    contact: '+1 (214) 555-0321',
    email: 'info@climatesystems.com',
    materials: ['HVAC Systems', 'Ventilation', 'Air Conditioning'],
    rating: 4.7,
  },
  {
    id: '5',
    name: 'ElectroSupply Corp',
    location: 'Atlanta, GA',
    contact: '+1 (404) 555-0654',
    email: 'orders@electrosupply.com',
    materials: ['Electrical Conduits', 'Wiring', 'Electrical Panels'],
    rating: 4.5,
  },
];

// Mock procurement timeline data
export const mockProcurementItems: ProcurementItem[] = [
  {
    id: '1',
    material: 'Structural Steel',
    orderBy: new Date('2024-04-15'),
    deliveryStart: new Date('2024-05-01'),
    deliveryEnd: new Date('2024-05-15'),
    status: 'critical',
    vendor: 'SteelCorp Industries',
  },
  {
    id: '2',
    material: 'Concrete (High-grade)',
    orderBy: new Date('2024-04-20'),
    deliveryStart: new Date('2024-05-10'),
    deliveryEnd: new Date('2024-05-25'),
    status: 'on-track',
    vendor: 'Premium Concrete Co.',
  },
  {
    id: '3',
    material: 'Glass Curtain Wall',
    orderBy: new Date('2024-05-01'),
    deliveryStart: new Date('2024-06-15'),
    deliveryEnd: new Date('2024-06-30'),
    status: 'warning',
    vendor: 'GlassTech Solutions',
  },
  {
    id: '4',
    material: 'HVAC Systems',
    orderBy: new Date('2024-05-15'),
    deliveryStart: new Date('2024-07-01'),
    deliveryEnd: new Date('2024-07-15'),
    status: 'on-track',
    vendor: 'Climate Systems Inc.',
  },
];

// Mock chat messages
export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    message: 'Hello! I can help you with procurement planning and material optimization. What would you like to know?',
    isUser: false,
    timestamp: new Date('2024-01-15T10:00:00'),
  },
  {
    id: '2',
    message: 'What are the most cost-effective alternatives for structural steel in my project?',
    isUser: true,
    timestamp: new Date('2024-01-15T10:01:00'),
  },
  {
    id: '3',
    message: 'Based on your project requirements, here are three alternatives:\n\n1. **Engineered Steel Beams** - 15% cost reduction\n2. **Composite Steel-Concrete** - 8% cost reduction, better fire resistance\n3. **Recycled Steel** - 25% cost reduction, environmentally friendly\n\nWould you like detailed specifications for any of these options?',
    isUser: false,
    timestamp: new Date('2024-01-15T10:01:30'),
  },
];

// Mock API functions
export const mockApiCall = async (endpoint: string, data?: any): Promise<any> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  switch (endpoint) {
    case '/predict':
      return {
        success: true,
        materials: mockMaterials,
        timeline: mockProcurementItems,
        totalCost: mockMaterials.reduce((sum, material) => sum + material.cost, 0),
        estimatedDuration: '6 months',
      };
    
    case '/chatbot':
      const responses = [
        'I can help you optimize your procurement strategy. What specific aspect would you like to focus on?',
        'Based on current market trends, I recommend ordering steel materials 2 weeks earlier than planned due to supply chain constraints.',
        'Your current timeline looks feasible. However, I suggest adding a 10% buffer for critical path items.',
        'Would you like me to analyze alternative suppliers for cost optimization?',
      ];
      return {
        success: true,
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
    
    default:
      return { success: false, error: 'Unknown endpoint' };
  }
};