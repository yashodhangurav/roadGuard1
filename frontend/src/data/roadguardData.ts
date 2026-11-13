export interface NavLink {
  label: string;
  href: string;
}

export interface MetricPillar {
  title: string;
  description: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface DefectItem {
  id: string;
  type: 'pothole' | 'crack' | 'rutting' | 'depression';
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  depthMm?: number;
  location: string;
  coordinates: [number, number];
  timestamp: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Demo', href: '#demo' },
  { label: 'Detection', href: '#detection' },
  { label: 'Mapping', href: '#mapping' },
  { label: 'Analysis', href: '#analysis' },
  { label: 'Resolution', href: '#resolution' },
  { label: 'FAQ', href: '#faq' },
];

export const HERO_CONTENT = {
  badge: 'Autonomous Pavement Intelligence',
  title: 'Detect it. Map it. Fix it.',
  lede: 'Transform road images and videos into actionable infrastructure intelligence using AI-powered road damage detection.',
  primaryCta: 'Explore Detection',
  secondaryCta: 'View Live Demo',
  videoDuration: '1:20',
  specs: ['Edge Vision', 'Real-Time 60 FPS', 'Sub-meter GPS', 'Model v4.2'],
};

export const MUNICIPAL_FACTS: MetricPillar[] = [
  {
    title: '100% On-Edge',
    description: 'Automatic license plate and pedestrian face blurring before any frame storage',
  },
  {
    title: 'Zero Cloud',
    description: 'Raw road video is never streamed off-device or stored on third-party servers',
  },
  {
    title: 'ASTM D6433',
    description: 'Certified Pavement Condition Index ratings matching civil infrastructure standards',
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'What types of road damage does RoadGuard AI detect?',
    answer: 'RoadGuard AI detects potholes, alligator cracking, transverse and longitudinal cracks, rutting, surface raveling, edge cracking, and sunken utility manholes across asphalt and concrete pavements.',
  },
  {
    id: 'faq-2',
    question: 'Can RoadGuard AI run on standard vehicle dashcams and smartphones?',
    answer: 'Yes. The edge vision pipeline runs on commercially available dashcams (Garmin, Nextbase), iOS and Android smartphones, and ruggedized vehicle-mounted edge computers like NVIDIA Jetson.',
  },
  {
    id: 'faq-3',
    question: 'How accurate is the pothole depth and volume measurement?',
    answer: 'Using calibrated multi-frame stereo photogrammetry and temporal depth models, RoadGuard AI achieves sub-centimeter vertical accuracy (±5mm), sufficient for calculating repair material volume.',
  },
  {
    id: 'faq-4',
    question: 'Does the system require continuous 5G or cellular connectivity?',
    answer: 'No. All inference, geocoding, and severity ranking occurs entirely on-device offline. Data synchronizes automatically when the vehicle returns to depot Wi-Fi or when cellular coverage is restored.',
  },
  {
    id: 'faq-5',
    question: 'How does RoadGuard AI comply with privacy and surveillance regulations?',
    answer: 'All video frames pass through an on-edge hardware anonymization layer that detects and permanently blurs pedestrian faces and vehicle license plates before writing to disk.',
  },
  {
    id: 'faq-6',
    question: 'Which municipal asset management and GIS systems are supported?',
    answer: 'RoadGuard AI exports native layers to Esri ArcGIS, Cityworks, Cartegraph, Trimble Cityworks, IBM Maximo, and standard GeoJSON / Shapefile formats.',
  },
  {
    id: 'faq-7',
    question: 'How does the Pavement Condition Index (PCI) calculation work?',
    answer: 'RoadGuard AI implements ASTM D6433 standard methodologies, aggregating defect type, severity level (Low, Medium, High), and surface area density to compute normalized 0–100 PCI ratings per road segment.',
  },
  {
    id: 'faq-8',
    question: 'Can drone or aerial survey footage be imported?',
    answer: 'Yes. RoadGuard AI processes georeferenced orthomosaics and aerial video streams captured by commercial drones, automatically generating corridor-wide surface damage heatmaps.',
  },
  {
    id: 'faq-9',
    question: 'How is the AI model retrained and validated?',
    answer: 'Models are benchmarked against ground-truth laser profilometer datasets and municipal road authority inspections, with quarterly updates reflecting seasonal road wear patterns.',
  },
];

export const SAMPLE_DEFECTS: DefectItem[] = [
  {
    id: 'def-101',
    type: 'pothole',
    severity: 'critical',
    confidence: 98.4,
    depthMm: 72,
    location: 'Route 101, MP 14.2 (Northbound Lane 1)',
    coordinates: [37.7749, -122.4194],
    timestamp: '11:24:02 AM',
  },
  {
    id: 'def-102',
    type: 'crack',
    severity: 'high',
    confidence: 94.1,
    depthMm: 18,
    location: 'Route 101, MP 14.8 (Shoulder Transition)',
    coordinates: [37.7782, -122.4168],
    timestamp: '11:24:48 AM',
  },
  {
    id: 'def-103',
    type: 'rutting',
    severity: 'medium',
    confidence: 91.7,
    depthMm: 34,
    location: 'Route 101, MP 15.6 (Wheelpath Rutting)',
    coordinates: [37.7831, -122.4121],
    timestamp: '11:25:31 AM',
  },
];

