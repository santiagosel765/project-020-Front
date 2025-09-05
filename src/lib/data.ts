

export type User = {
  id: string;
  name: string;
  position: string;
  department: string;
  username: string;
  employeeCode: string;
  phone: string;
  email: string;
  notificationType: 'Whatsapp';
  role: 'Admin' | 'General' | 'Supervisor';
  avatar: string;
};

export type DocumentUser = User & {
    statusChangeDate?: string;
}

export type Document = {
  id: string;
  code: string;
  name: string;
  description: string;
  sendDate: string;
  lastStatusChangeDate: string;
  businessDays: number;
  status: 'Completado' | 'Rechazado' | 'Pendiente' | 'En Progreso';
  assignedUsers: DocumentUser[];
  filePath?: string;
};

export let users: User[] = [
  { id: '1', name: 'Ana María García López', position: 'CEO', department: 'Dirección', username: 'agarcia', employeeCode: 'EMP001', phone: '55550101', email: 'ana.garcia@example.com', notificationType: 'Whatsapp', role: 'Admin', avatar: 'https://placehold.co/100x100.png' },
  { id: '2', name: 'Carlos Alberto Martínez González', position: 'Director de Finanzas', department: 'Finanzas', username: 'cmartinez', employeeCode: 'EMP002', phone: '55550102', email: 'carlos.martinez@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '3', name: 'Laura Isabel Rodríguez Pérez', position: 'Abogada Principal', department: 'Legal', username: 'lrodriguez', employeeCode: 'EMP003', phone: '55550103', email: 'laura.rodriguez@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '4', name: 'Juan Carlos Pérez Sánchez', position: 'Gerente de RRHH', department: 'Recursos Humanos', username: 'jperez', employeeCode: 'EMP004', phone: '55550104', email: 'juan.perez@example.com', notificationType: 'Whatsapp', role: 'Supervisor', avatar: 'https://placehold.co/100x100.png' },
  { id: '5', name: 'Sofía Valentina López Hernández', position: 'Desarrolladora Senior', department: 'IT', username: 'slopez', employeeCode: 'EMP005', phone: '55550105', email: 'sofia.lopez@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '6', name: 'Miguel Ángel Hernández Ramírez', position: 'Analista de Marketing', department: 'Marketing', username: 'mhernandez', employeeCode: 'EMP006', phone: '55550106', email: 'miguel.hernandez@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '7', name: 'Isabela Cristina Castillo Flores', position: 'Diseñadora UX/UI', department: 'Diseño', username: 'icastillo', employeeCode: 'EMP007', phone: '55550107', email: 'isabela.castillo@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '8', name: 'David Alejandro Guzmán Gómez', position: 'Gerente de Producto', department: 'Producto', username: 'dguzman', employeeCode: 'EMP008', phone: '55550108', email: 'david.guzman@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '9', name: 'Valentina Sofía Morales Cruz', position: 'Analista de Datos', department: 'Business Intelligence', username: 'vmorales', employeeCode: 'EMP009', phone: '55550109', email: 'valentina.morales@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '10', name: 'Javier Andrés Rojas Ortiz', position: 'Ingeniero de Soporte', department: 'IT', username: 'jrojas', employeeCode: 'EMP010', phone: '55550110', email: 'javier.rojas@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '11', name: 'Camila Andrea Díaz Reyes', position: 'Coordinadora de Marketing', department: 'Marketing', username: 'cdiaz', employeeCode: 'EMP011', phone: '55550111', email: 'camila.diaz@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '12', name: 'Andrés Felipe Moreno Jiménez', position: 'Contador Senior', department: 'Finanzas', username: 'amoreno', employeeCode: 'EMP012', phone: '55550112', email: 'andres.moreno@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '13', name: 'Gabriela Fernanda Ortiz Silva', position: 'Reclutadora', department: 'Recursos Humanos', username: 'gortiz', employeeCode: 'EMP013', phone: '55550113', email: 'gabriela.ortiz@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '14', name: 'Ricardo Antonio Romero Vargas', position: 'Consultor Legal', department: 'Legal', username: 'rromero', employeeCode: 'EMP014', phone: '55550114', email: 'ricardo.romero@example.com', notificationType: 'Whatsapp', role: 'General', avatar: 'https://placehold.co/100x100.png' },
  { id: '15', name: 'Daniela Alejandra Flores Mendoza', position: 'Gerente de Operaciones', department: 'Operaciones', username: 'dflores', employeeCode: 'EMP015', phone: '55550115', email: 'daniela.flores@example.com', notificationType: 'Whatsapp', role: 'Admin', avatar: 'https://placehold.co/100x100.png' },
  { id: '0', name: 'Leonel Sabbagh', position: 'Administrador Principal', department: 'IT', username: 'lsabbagh', employeeCode: 'EMP000', phone: '55550100', email: 'lsabbagh@example.com', notificationType: 'Whatsapp', role: 'Admin', avatar: 'https://placehold.co/100x100.png' },
];

const assignRandomUsers = (): DocumentUser[] => {
  const shuffled = users.filter(u => u.id !== '0').sort(() => 0.5 - Math.random());
  const count = Math.floor(Math.random() * 5) + 4; // 4 to 8 users
  
  const today = new Date();
  
  return shuffled.slice(0, count).map((user, index) => {
    // Mock a status change date from 1 to 10 days ago
    const date = new Date(today);
    date.setDate(today.getDate() - (index + 1));
    return {
      ...user,
      statusChangeDate: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
    }
  });
};

export const documents: Document[] = [
  { id: 'DOC001', code: 'F-LG-001', name: 'Acuerdo de Confidencialidad 2024', description: 'Acuerdo de no divulgación para el proyecto "Phoenix".', sendDate: '10/05/2024', lastStatusChangeDate: '15/05/2024', businessDays: 0, status: 'Completado', assignedUsers: assignRandomUsers(), filePath: '/files/prueba.pdf' },
  { id: 'DOC002', code: 'C-TI-012', name: 'Contrato de Servicios de TI', description: 'Contrato con proveedor de servicios en la nube.', sendDate: '15/05/2024', lastStatusChangeDate: '20/05/2024', businessDays: 0, status: 'En Progreso', assignedUsers: assignRandomUsers(), filePath: '/files/prueba.pdf' },
  { id: 'DOC003', code: 'P-RH-005', name: 'Política de Trabajo Remoto', description: 'Actualización de la política de trabajo desde casa.', sendDate: '20/05/2024', lastStatusChangeDate: '20/05/2024', businessDays: 0, status: 'Pendiente', assignedUsers: assignRandomUsers(), filePath: '/files/prueba.pdf' },
  { id: 'DOC004', code: 'R-FN-023', name: 'Reporte Financiero Q1 2024', description: 'Resultados financieros del primer trimestre.', sendDate: '25/04/2024', lastStatusChangeDate: '30/04/2024', businessDays: 0, status: 'Rechazado', assignedUsers: assignRandomUsers(), filePath: '/files/prueba.pdf' },
  { id: 'DOC005', code: 'P-MK-009', name: 'Plan de Marketing Digital', description: 'Estrategia de marketing para el lanzamiento de nuevo producto.', sendDate: '01/06/2024', lastStatusChangeDate: '05/06/2024', businessDays: 0, status: 'En Progreso', assignedUsers: assignRandomUsers(), filePath: '/files/prueba.pdf' },
  { id: 'DOC006', code: 'M-DC-001', name: 'Manual de Identidad Corporativa', description: 'Guía de estilo y uso de la marca.', sendDate: '05/06/2024', lastStatusChangeDate: '10/06/2024', businessDays: 0, status: 'Completado', assignedUsers: assignRandomUsers(), filePath: '/files/prueba.pdf' },
  { id: 'DOC007', code: 'F-RH-011', name: 'Evaluación de Desempeño 2023', description: 'Formularios y resultados de la evaluación anual.', sendDate: '12/03/2024', lastStatusChangeDate: '20/03/2024', businessDays: 0, status: 'Completado', assignedUsers: assignRandomUsers(), filePath: '/files/prueba.pdf' },
  { id: 'DOC008', code: 'P-VN-045', name: 'Propuesta Comercial - Cliente X', description: 'Propuesta de servicios para nuevo cliente potencial.', sendDate: '10/06/2024', lastStatusChangeDate: '10/06/2024', businessDays: 0, status: 'Pendiente', assignedUsers: assignRandomUsers(), filePath: '/files/prueba.pdf' },
  { id: 'DOC009', code: 'A-DR-003', name: 'Acta de Reunión de Directorio', description: 'Minuta de la reunión de directorio de mayo 2024.', sendDate: '28/05/2024', lastStatusChangeDate: '03/06/2024', businessDays: 0, status: 'En Progreso', assignedUsers: assignRandomUsers(), filePath: '/files/prueba.pdf' },
  { id: 'DOC010', code: 'S-TI-015', name: 'Solicitud de Compra de Equipo', description: 'Requisición de nuevos laptops para el equipo de IT.', sendDate: '11/06/2024', lastStatusChangeDate: '11/06/2024', businessDays: 0, status: 'Pendiente', assignedUsers: assignRandomUsers(), filePath: '/files/prueba.pdf' },
];

    
