/**
 * Catálogo normalizado de habilidades para colegios técnico-profesionales chilenos.
 *
 * Estructura:
 *  - canonical: nombre oficial normalizado (minúsculas)
 *  - aliases: variantes, sinónimos, abreviaciones aceptadas
 *  - category: TECNICA | BLANDA
 *  - specialties: especialidades técnicas donde aplica principalmente
 */

export type SkillCatalogCategory = 'TECNICA' | 'BLANDA'

export interface SkillEntry {
  canonical: string
  aliases: string[]
  category: SkillCatalogCategory
  specialties?: string[]
}

export const SKILLS_CATALOG: SkillEntry[] = [

  // ─── Programación / Informática ───────────────────────────────────────────

  { canonical: 'html', aliases: ['html5', 'html/css', 'lenguaje html', 'html básico', 'marcado html'], category: 'TECNICA', specialties: ['informática', 'programación', 'web'] },
  { canonical: 'css', aliases: ['css3', 'hojas de estilo', 'estilos web', 'css básico', 'css avanzado', 'sass', 'scss', 'tailwind', 'bootstrap'], category: 'TECNICA', specialties: ['informática', 'programación', 'web'] },
  { canonical: 'javascript', aliases: ['js', 'java script', 'ecmascript', 'es6', 'vanilla js', 'javascript básico', 'javascript moderno', 'programación javascript'], category: 'TECNICA', specialties: ['informática', 'programación', 'web'] },
  { canonical: 'typescript', aliases: ['ts', 'typescript js', 'programación typescript'], category: 'TECNICA', specialties: ['informática', 'programación'] },
  { canonical: 'react', aliases: ['reactjs', 'react.js', 'react js', 'react hooks', 'react native', 'react router'], category: 'TECNICA', specialties: ['informática', 'programación', 'web'] },
  { canonical: 'vue.js', aliases: ['vue', 'vuejs', 'vue js', 'programación vue'], category: 'TECNICA', specialties: ['informática', 'programación', 'web'] },
  { canonical: 'angular', aliases: ['angularjs', 'angular 2+', 'angular js', 'programación angular'], category: 'TECNICA', specialties: ['informática', 'programación', 'web'] },
  { canonical: 'node.js', aliases: ['nodejs', 'node js', 'node', 'node backend', 'express.js', 'expressjs', 'express js'], category: 'TECNICA', specialties: ['informática', 'programación'] },
  { canonical: 'python', aliases: ['python3', 'programación python', 'python básico', 'python avanzado', 'django', 'flask', 'fastapi'], category: 'TECNICA', specialties: ['informática', 'programación', 'datos'] },
  { canonical: 'java', aliases: ['programación java', 'java se', 'java ee', 'java básico', 'java spring', 'spring boot'], category: 'TECNICA', specialties: ['informática', 'programación'] },
  { canonical: 'php', aliases: ['php7', 'php8', 'programación php', 'php laravel', 'laravel', 'wordpress'], category: 'TECNICA', specialties: ['informática', 'web'] },
  { canonical: 'c#', aliases: ['csharp', 'c sharp', 'programación c#', 'dotnet', '.net', 'asp.net'], category: 'TECNICA', specialties: ['informática', 'programación'] },
  { canonical: 'c++', aliases: ['c plus plus', 'cpp', 'programación c++', 'c/c++'], category: 'TECNICA', specialties: ['informática', 'programación', 'mecánica', 'electrónica'] },
  { canonical: 'sql', aliases: ['mysql', 'postgresql', 'postgres', 'base de datos sql', 'sql server', 'sqlite', 'tsql', 'sql básico', 'consultas sql', 'bases de datos relacionales'], category: 'TECNICA', specialties: ['informática', 'programación', 'datos', 'administración'] },
  { canonical: 'mongodb', aliases: ['mongo', 'base de datos nosql', 'nosql', 'firebase', 'bases de datos no relacionales'], category: 'TECNICA', specialties: ['informática', 'programación'] },
  { canonical: 'git', aliases: ['github', 'gitlab', 'bitbucket', 'control de versiones', 'git/github', 'versionamiento', 'git flow'], category: 'TECNICA', specialties: ['informática', 'programación'] },
  { canonical: 'api rest', aliases: ['rest api', 'servicios web rest', 'api restful', 'api', 'consumo de apis', 'integración de apis', 'web services', 'soap'], category: 'TECNICA', specialties: ['informática', 'programación'] },
  { canonical: 'docker', aliases: ['contenedores docker', 'docker/kubernetes', 'contenerización', 'kubernetes', 'k8s', 'docker compose'], category: 'TECNICA', specialties: ['informática', 'redes'] },
  { canonical: 'linux', aliases: ['ubuntu', 'debian', 'sistema operativo linux', 'bash linux', 'unix', 'centos', 'redhat', 'comandos linux', 'terminal linux', 'shell scripting'], category: 'TECNICA', specialties: ['informática', 'redes', 'sistemas'] },
  { canonical: 'desarrollo web', aliases: ['programación web', 'web development', 'desarrollo web básico', 'diseño y desarrollo web', 'fullstack', 'full stack', 'frontend', 'front-end', 'backend', 'back-end'], category: 'TECNICA', specialties: ['informática', 'programación', 'web'] },
  { canonical: 'figma', aliases: ['diseño figma', 'prototipado figma', 'ui/ux figma', 'ux design', 'ui design', 'diseño ui/ux', 'wireframes'], category: 'TECNICA', specialties: ['informática', 'diseño'] },
  { canonical: 'wordpress', aliases: ['cms wordpress', 'desarrollo wordpress', 'diseño wordpress', 'woocommerce'], category: 'TECNICA', specialties: ['informática', 'web', 'diseño'] },
  { canonical: 'análisis de datos', aliases: ['ciencia de datos', 'data science', 'data analysis', 'analítica de datos', 'business intelligence', 'bi'], category: 'TECNICA', specialties: ['informática', 'datos', 'administración'] },
  { canonical: 'machine learning', aliases: ['inteligencia artificial', 'ia', 'ai', 'ml', 'aprendizaje automático', 'deep learning'], category: 'TECNICA', specialties: ['informática', 'datos'] },
  { canonical: 'testing', aliases: ['qa', 'calidad de software', 'pruebas de software', 'testing manual', 'testing automatizado', 'selenium', 'jest', 'unit testing'], category: 'TECNICA', specialties: ['informática', 'programación'] },
  { canonical: 'diseño gráfico', aliases: ['photoshop', 'illustrator', 'adobe photoshop', 'adobe illustrator', 'indesign', 'diseño digital', 'diseño multimedia'], category: 'TECNICA', specialties: ['informática', 'diseño', 'marketing'] },
  { canonical: 'power bi', aliases: ['powerbi', 'power bi desktop', 'visualización de datos', 'tableau', 'reportes power bi'], category: 'TECNICA', specialties: ['administración', 'contabilidad', 'datos'] },
  { canonical: 'scrum', aliases: ['metodología scrum', 'metodologías ágiles', 'agile', 'kanban', 'jira', 'gestión de proyectos ágil'], category: 'TECNICA', specialties: ['informática', 'programación', 'administración'] },

  // ─── Redes y Telecomunicaciones ───────────────────────────────────────────

  { canonical: 'cisco networking', aliases: ['cisco', 'ccna', 'cisco ccna', 'redes cisco', 'packet tracer', 'cisco packet tracer'], category: 'TECNICA', specialties: ['redes', 'telecomunicaciones'] },
  { canonical: 'tcp/ip', aliases: ['protocolos tcp/ip', 'protocolo tcp ip', 'modelo tcp/ip', 'redes tcp/ip', 'protocolo de red', 'protocolos de red'], category: 'TECNICA', specialties: ['redes', 'telecomunicaciones'] },
  { canonical: 'redes informáticas', aliases: ['networking', 'redes', 'fundamentos de redes', 'redes de computadores', 'redes de datos', 'redes lan', 'redes wan', 'redes inalámbricas', 'wifi'], category: 'TECNICA', specialties: ['redes', 'telecomunicaciones', 'informática'] },
  { canonical: 'configuración de routers', aliases: ['routers', 'enrutadores', 'configuración de routers y switches', 'switches', 'router', 'switch'], category: 'TECNICA', specialties: ['redes'] },
  { canonical: 'seguridad informática', aliases: ['ciberseguridad', 'cybersecurity', 'seguridad de redes', 'seguridad en redes', 'ethical hacking', 'seguridad it', 'hacking ético', 'seguridad cibernética', 'firewall'], category: 'TECNICA', specialties: ['redes', 'informática'] },
  { canonical: 'aws', aliases: ['amazon web services', 'cloud aws', 'amazon aws', 'nube aws', 'cloud computing', 'computación en la nube', 'azure', 'google cloud', 'gcp'], category: 'TECNICA', specialties: ['redes', 'informática', 'cloud'] },
  { canonical: 'monitoreo de redes', aliases: ['monitoreo', 'nagios', 'zabbix', 'monitoreo de sistemas', 'administración de redes'], category: 'TECNICA', specialties: ['redes'] },
  { canonical: 'vlan', aliases: ['vlans', 'configuración vlan', 'redes vlan', 'segmentación de redes'], category: 'TECNICA', specialties: ['redes'] },
  { canonical: 'soporte técnico', aliases: ['soporte it', 'help desk', 'mesa de ayuda', 'asistencia técnica', 'mantenimiento de equipos', 'mantenimiento de computadores', 'reparación de equipos'], category: 'TECNICA', specialties: ['redes', 'informática'] },
  { canonical: 'active directory', aliases: ['directorio activo', 'windows server', 'administración de servidor', 'servidores windows'], category: 'TECNICA', specialties: ['redes', 'informática'] },
  { canonical: 'vpn', aliases: ['redes vpn', 'configuración vpn', 'red privada virtual'], category: 'TECNICA', specialties: ['redes'] },
  { canonical: 'fibra óptica', aliases: ['cableado estructurado', 'instalación de fibra óptica', 'redes de fibra', 'cableado de red'], category: 'TECNICA', specialties: ['redes', 'telecomunicaciones'] },

  // ─── Electricidad y Electrónica ───────────────────────────────────────────

  { canonical: 'instalaciones eléctricas', aliases: ['instalación eléctrica', 'electricidad domiciliaria', 'instalaciones eléctricas domiciliarias', 'instalaciones eléctricas residenciales', 'instalaciones eléctricas industriales', 'tableros eléctricos'], category: 'TECNICA', specialties: ['electricidad', 'electrónica'] },
  { canonical: 'circuitos eléctricos', aliases: ['circuitos', 'electrónica básica', 'electrónica analógica', 'circuitos electrónicos', 'circuitos dc', 'circuitos ac', 'circuitos de corriente continua', 'circuitos de corriente alterna'], category: 'TECNICA', specialties: ['electricidad', 'electrónica'] },
  { canonical: 'automatización', aliases: ['automatización industrial', 'plc', 'controladores lógicos', 'automatismos', 'programación de plc', 'siemens plc', 'allen bradley', 'scada'], category: 'TECNICA', specialties: ['electricidad', 'electrónica', 'mecánica'] },
  { canonical: 'electrónica digital', aliases: ['digital electronics', 'microcontroladores', 'arduino', 'raspberry pi', 'esp32', 'iot', 'internet de las cosas', 'prototipado electrónico'], category: 'TECNICA', specialties: ['electrónica', 'informática'] },
  { canonical: 'mantención eléctrica', aliases: ['mantenimiento eléctrico', 'mantención de equipos eléctricos', 'reparación eléctrica', 'mantenimiento correctivo eléctrico'], category: 'TECNICA', specialties: ['electricidad'] },
  { canonical: 'norma sec', aliases: ['normativa sec', 'reglamento sec', 'normas eléctricas', 'electricidad reglamento', 'normativa eléctrica chilena'], category: 'TECNICA', specialties: ['electricidad'] },
  { canonical: 'instrumentación', aliases: ['instrumentación industrial', 'calibración de instrumentos', 'medición eléctrica', 'multímetro', 'osciloscopio'], category: 'TECNICA', specialties: ['electricidad', 'electrónica'] },
  { canonical: 'motores eléctricos', aliases: ['instalación de motores', 'motores trifásicos', 'variadores de frecuencia', 'arrancadores de motor'], category: 'TECNICA', specialties: ['electricidad', 'mecánica'] },
  { canonical: 'energías renovables', aliases: ['energía solar', 'paneles solares', 'fotovoltaico', 'instalación solar', 'energía eólica', 'sistemas fotovoltaicos'], category: 'TECNICA', specialties: ['electricidad', 'construcción'] },
  { canonical: 'soldadura eléctrica', aliases: ['soldadura por arco', 'soldadura arco eléctrico', 'electrodo', 'soldadura smaw'], category: 'TECNICA', specialties: ['electricidad', 'mecánica'] },
  { canonical: 'cálculo eléctrico', aliases: ['cálculo de cargas eléctricas', 'diseño eléctrico', 'dimensionamiento eléctrico'], category: 'TECNICA', specialties: ['electricidad'] },

  // ─── Mecánica ──────────────────────────────────────────────────────────────

  { canonical: 'mecánica automotriz', aliases: ['mecánica automotive', 'mecánica de vehículos', 'mecánica de autos', 'mantención automotriz', 'mantenimiento de vehículos', 'mecánica general', 'taller mecánico'], category: 'TECNICA', specialties: ['mecánica'] },
  { canonical: 'soldadura', aliases: ['soldadura mig', 'soldadura tig', 'soldadura autógena', 'técnica de soldadura', 'soldadura mig/tig', 'soldadura oxiacetilénica'], category: 'TECNICA', specialties: ['mecánica', 'construcción'] },
  { canonical: 'torno', aliases: ['tornería', 'torno mecánico', 'operación de torno', 'torneado', 'torno cnc'], category: 'TECNICA', specialties: ['mecánica'] },
  { canonical: 'neumática', aliases: ['neumática e hidráulica', 'hidráulica', 'sistemas neumáticos', 'sistemas hidráulicos', 'oleohidráulica'], category: 'TECNICA', specialties: ['mecánica', 'electricidad'] },
  { canonical: 'diagnóstico automotriz', aliases: ['diagnóstico de vehículos', 'scanner automotriz', 'diagnóstico electrónico', 'diagnóstico vehicular', 'escáner automotriz'], category: 'TECNICA', specialties: ['mecánica'] },
  { canonical: 'mantención industrial', aliases: ['mantenimiento industrial', 'mantención de máquinas', 'mantenimiento preventivo', 'mantenimiento predictivo', 'mantenimiento correctivo'], category: 'TECNICA', specialties: ['mecánica', 'electricidad'] },
  { canonical: 'mecanizado cnc', aliases: ['cnc', 'fresadora cnc', 'control numérico', 'programación cnc', 'maquinado cnc'], category: 'TECNICA', specialties: ['mecánica'] },
  { canonical: 'dibujo técnico', aliases: ['dibujo mecánico', 'dibujo industrial', 'dibujo de planos', 'trazado mecánico'], category: 'TECNICA', specialties: ['mecánica', 'construcción', 'electricidad'] },
  { canonical: 'mecánica diesel', aliases: ['motores diesel', 'mecánica de maquinaria pesada', 'maquinaria pesada', 'excavadora', 'camiones'], category: 'TECNICA', specialties: ['mecánica'] },
  { canonical: 'refrigeración', aliases: ['refrigeración y climatización', 'aire acondicionado', 'hvac', 'sistemas de refrigeración', 'climatización'], category: 'TECNICA', specialties: ['mecánica', 'electricidad'] },
  { canonical: 'ajuste mecánico', aliases: ['ajustador mecánico', 'ajuste de piezas', 'limado', 'operaciones de banco'], category: 'TECNICA', specialties: ['mecánica'] },
  { canonical: 'lubricación', aliases: ['lubricación industrial', 'engrase', 'lubricantes', 'mantenimiento con lubricación'], category: 'TECNICA', specialties: ['mecánica'] },

  // ─── Construcción ─────────────────────────────────────────────────────────

  { canonical: 'lectura de planos', aliases: ['planos de construcción', 'interpretación de planos', 'planos arquitectónicos', 'lectura de planos arquitectónicos', 'planos estructurales'], category: 'TECNICA', specialties: ['construcción'] },
  { canonical: 'albañilería', aliases: ['construcción en obra', 'mampostería', 'albañilería básica', 'albañilería avanzada', 'obra gruesa', 'muros de ladrillo'], category: 'TECNICA', specialties: ['construcción'] },
  { canonical: 'topografía', aliases: ['mediciones topográficas', 'nivelación', 'levantamiento topográfico', 'estación total', 'gps topográfico', 'replanteo', 'topografía digital'], category: 'TECNICA', specialties: ['construcción'] },
  { canonical: 'autocad', aliases: ['auto cad', 'cad', 'diseño cad', 'dibujo técnico cad', 'autocad 2d', 'autocad 3d', 'autocad civil', 'autodesk'], category: 'TECNICA', specialties: ['construcción', 'electricidad', 'mecánica'] },
  { canonical: 'hormigón', aliases: ['trabajo con hormigón', 'hormigón armado', 'estructura de hormigón', 'encofrado', 'ferrallado'], category: 'TECNICA', specialties: ['construcción'] },
  { canonical: 'instalaciones sanitarias', aliases: ['gasfitería', 'plomería', 'instalaciones de agua', 'instalaciones de gas', 'gasfiter', 'fontanería'], category: 'TECNICA', specialties: ['construcción'] },
  { canonical: 'revestimientos', aliases: ['cerámica', 'porcelanato', 'estuco', 'pintura de obras', 'yeso'], category: 'TECNICA', specialties: ['construcción'] },
  { canonical: 'carpintería', aliases: ['carpintería de obras', 'carpintería de madera', 'pisos de madera', 'puertas y ventanas'], category: 'TECNICA', specialties: ['construcción'] },
  { canonical: 'presupuesto de obras', aliases: ['cubicaciones', 'cubicación', 'presupuesto construcción', 'cómputo métrico', 'metrado'], category: 'TECNICA', specialties: ['construcción'] },
  { canonical: 'seguridad en obras', aliases: ['prevención de riesgos en construcción', 'uso de epp', 'equipos de protección', 'seguridad laboral obras'], category: 'TECNICA', specialties: ['construcción'] },
  { canonical: 'bim', aliases: ['revit', 'modelado bim', 'building information modeling', 'autocad revit'], category: 'TECNICA', specialties: ['construcción'] },
  { canonical: 'tabiques y cielos', aliases: ['tabiquería', 'drywall', 'planchas de yeso', 'cielos falsos', 'estructura metálica liviana'], category: 'TECNICA', specialties: ['construcción'] },

  // ─── Gastronomía ──────────────────────────────────────────────────────────

  { canonical: 'técnicas culinarias', aliases: ['cocina', 'cocina básica', 'gastronomía', 'técnicas de cocina', 'cocina profesional', 'preparación de alimentos', 'cortes de cocina', 'cocción'], category: 'TECNICA', specialties: ['gastronomía'] },
  { canonical: 'repostería', aliases: ['pastelería', 'pastelería y repostería', 'pastelería básica', 'panadería', 'panadería y repostería', 'decoración de tortas'], category: 'TECNICA', specialties: ['gastronomía'] },
  { canonical: 'manipulación de alimentos', aliases: ['inocuidad alimentaria', 'higiene alimentaria', 'seguridad alimentaria', 'bpm alimentos', 'bpa', 'buenas prácticas de manufactura', 'haccp'], category: 'TECNICA', specialties: ['gastronomía', 'logística'] },
  { canonical: 'servicio de mesa', aliases: ['mesero', 'garzón', 'servicio de restaurante', 'atención en mesa', 'protocolo de servicio', 'bartender', 'barista'], category: 'TECNICA', specialties: ['gastronomía'] },
  { canonical: 'cocina internacional', aliases: ['gastronomía internacional', 'cocina italiana', 'cocina francesa', 'cocina asiática', 'cocina española', 'cocina peruana', 'fusión'], category: 'TECNICA', specialties: ['gastronomía'] },
  { canonical: 'gestión de cocina', aliases: ['gestión gastronómica', 'administración de cocina', 'costos de cocina', 'fichas técnicas de cocina'], category: 'TECNICA', specialties: ['gastronomía', 'administración'] },
  { canonical: 'enología', aliases: ['sumiller', 'sommelier', 'vinos', 'cata de vinos', 'maridaje'], category: 'TECNICA', specialties: ['gastronomía'] },
  { canonical: 'decoración de platos', aliases: ['montaje de platos', 'presentación de platos', 'emplatado', 'decoración gastronómica'], category: 'TECNICA', specialties: ['gastronomía'] },

  // ─── Administración / Contabilidad ────────────────────────────────────────

  { canonical: 'excel', aliases: ['microsoft excel', 'excel básico', 'excel intermedio', 'excel avanzado', 'planillas excel', 'hojas de cálculo', 'excel con macros', 'tablas dinámicas excel'], category: 'TECNICA', specialties: ['administración', 'contabilidad', 'logística'] },
  { canonical: 'contabilidad', aliases: ['contabilidad básica', 'contabilidad general', 'principios de contabilidad', 'contabilidad financiera', 'contabilidad de costos', 'contabilidad gerencial'], category: 'TECNICA', specialties: ['contabilidad', 'administración'] },
  { canonical: 'facturación', aliases: ['boletas y facturas', 'facturación electrónica', 'documentos tributarios', 'dte', 'documentos tributarios electrónicos'], category: 'TECNICA', specialties: ['contabilidad', 'administración'] },
  { canonical: 'office', aliases: ['microsoft office', 'suite office', 'word excel powerpoint', 'ms office', 'word', 'powerpoint', 'microsoft word', 'microsoft powerpoint', 'outlook'], category: 'TECNICA', specialties: ['administración', 'contabilidad'] },
  { canonical: 'sii', aliases: ['sistema sii', 'tributario sii', 'declaración iva', 'impuestos', 'declaración de impuestos', 'formulario 29', 'f29', 'iva', 'impuesto al valor agregado'], category: 'TECNICA', specialties: ['contabilidad'] },
  { canonical: 'gestión administrativa', aliases: ['administración', 'procesos administrativos', 'gestión de oficina', 'secretariado', 'asistente administrativo', 'técnico administrativo'], category: 'TECNICA', specialties: ['administración'] },
  { canonical: 'recursos humanos', aliases: ['rrhh', 'gestión de personas', 'administración de rrhh', 'liquidaciones de sueldo', 'contrato de trabajo', 'relaciones laborales'], category: 'TECNICA', specialties: ['administración'] },
  { canonical: 'remuneraciones', aliases: ['liquidación de sueldos', 'sueldos', 'planilla de sueldos', 'cálculo de remuneraciones', 'ley de gratificaciones'], category: 'TECNICA', specialties: ['contabilidad', 'administración'] },
  { canonical: 'finanzas', aliases: ['finanzas básicas', 'análisis financiero', 'flujo de caja', 'balance general', 'estado de resultados', 'ratios financieros'], category: 'TECNICA', specialties: ['contabilidad', 'administración'] },
  { canonical: 'erp', aliases: ['sistema erp', 'sap', 'oracle erp', 'softland', 'bsale', 'sistema de gestión empresarial'], category: 'TECNICA', specialties: ['administración', 'contabilidad', 'logística'] },
  { canonical: 'auditoría', aliases: ['auditoría interna', 'control interno', 'auditoría contable', 'auditoría financiera', 'revisión contable'], category: 'TECNICA', specialties: ['contabilidad'] },
  { canonical: 'presupuesto empresarial', aliases: ['presupuesto', 'planificación presupuestaria', 'control presupuestario', 'elaboración de presupuestos'], category: 'TECNICA', specialties: ['administración', 'contabilidad'] },
  { canonical: 'gestión de documentos', aliases: ['archivo', 'gestión documental', 'manejo de archivos', 'administración de documentos', 'correspondencia'], category: 'TECNICA', specialties: ['administración'] },

  // ─── Atención al Cliente / Ventas ─────────────────────────────────────────

  { canonical: 'atención al cliente', aliases: ['servicio al cliente', 'customer service', 'atención de clientes', 'atención telefónica', 'call center', 'contacto con clientes', 'orientación al cliente'], category: 'TECNICA', specialties: ['ventas', 'atención al cliente', 'administración'] },
  { canonical: 'ventas', aliases: ['técnicas de ventas', 'venta directa', 'comercial', 'vendedor', 'cierre de ventas', 'prospección', 'venta consultiva', 'venta b2b', 'venta b2c'], category: 'TECNICA', specialties: ['ventas', 'comercial'] },
  { canonical: 'caja', aliases: ['operación de caja', 'cajero', 'manejo de caja', 'punto de venta', 'pos', 'terminal de punto de venta', 'caja registradora'], category: 'TECNICA', specialties: ['ventas', 'gastronomía'] },
  { canonical: 'marketing digital', aliases: ['redes sociales', 'community manager', 'social media', 'marketing en redes', 'facebook ads', 'google ads', 'seo', 'sem', 'email marketing', 'publicidad digital'], category: 'TECNICA', specialties: ['ventas', 'administración', 'informática'] },
  { canonical: 'negociación', aliases: ['técnicas de negociación', 'negociación comercial', 'negociación con proveedores', 'negociación con clientes'], category: 'TECNICA', specialties: ['ventas', 'administración'] },
  { canonical: 'merchandising', aliases: ['visual merchandising', 'exhibición de productos', 'gestión de góndola', 'planograma'], category: 'TECNICA', specialties: ['ventas', 'logística'] },
  { canonical: 'crm', aliases: ['gestión de relaciones con clientes', 'salesforce', 'hubspot', 'sistema crm', 'fidelización de clientes'], category: 'TECNICA', specialties: ['ventas', 'administración'] },
  { canonical: 'e-commerce', aliases: ['comercio electrónico', 'tienda online', 'venta online', 'marketplace', 'tienda virtual', 'shopify', 'woocommerce ecommerce'], category: 'TECNICA', specialties: ['ventas', 'informática'] },

  // ─── Logística ────────────────────────────────────────────────────────────

  { canonical: 'logística', aliases: ['supply chain', 'cadena de suministro', 'logística básica', 'logística de almacén', 'logística y distribución', 'gestión logística'], category: 'TECNICA', specialties: ['logística'] },
  { canonical: 'inventario', aliases: ['control de inventario', 'gestión de inventario', 'control de stock', 'bodega', 'gestión de bodega', 'toma de inventario', 'inventario físico'], category: 'TECNICA', specialties: ['logística', 'administración'] },
  { canonical: 'despacho y recepción', aliases: ['recepción de mercadería', 'despacho', 'operador de bodega', 'almacenaje', 'picking', 'packing', 'preparación de pedidos'], category: 'TECNICA', specialties: ['logística'] },
  { canonical: 'manejo de montacargas', aliases: ['montacargas', 'grúa horquilla', 'forklift', 'operación de montacargas'], category: 'TECNICA', specialties: ['logística'] },
  { canonical: 'importación y exportación', aliases: ['comercio exterior', 'aduana', 'documentación aduanera', 'logística internacional'], category: 'TECNICA', specialties: ['logística', 'administración'] },
  { canonical: 'gestión de compras', aliases: ['compras', 'adquisiciones', 'proceso de compras', 'licitaciones', 'cotizaciones', 'abastecimiento'], category: 'TECNICA', specialties: ['logística', 'administración'] },
  { canonical: 'transporte y distribución', aliases: ['flota de transporte', 'gestión de flota', 'distribución de productos', 'rutas de distribución', 'last mile'], category: 'TECNICA', specialties: ['logística'] },

  // ─── Salud / Enfermería ───────────────────────────────────────────────────

  { canonical: 'primeros auxilios', aliases: ['primeros auxilios básicos', 'rcp', 'auxilios básicos', 'emergencias médicas', 'soporte vital básico', 'desfibrilador'], category: 'TECNICA', specialties: ['salud', 'enfermería'] },
  { canonical: 'atención de pacientes', aliases: ['cuidado de pacientes', 'enfermería básica', 'técnico en enfermería', 'atención primaria', 'ten', 'técnico en enfermería de nivel superior'], category: 'TECNICA', specialties: ['salud', 'enfermería'] },
  { canonical: 'anatomía y fisiología', aliases: ['anatomía humana', 'fisiología humana', 'ciencias básicas de salud'], category: 'TECNICA', specialties: ['salud', 'enfermería'] },
  { canonical: 'administración de medicamentos', aliases: ['farmacología básica', 'vías de administración', 'procedimientos de enfermería'], category: 'TECNICA', specialties: ['salud', 'enfermería'] },
  { canonical: 'bioseguridad', aliases: ['normas de bioseguridad', 'barrera de bioseguridad', 'higiene hospitalaria', 'control de infecciones'], category: 'TECNICA', specialties: ['salud', 'enfermería'] },

  // ─── Turismo / Hotelería ──────────────────────────────────────────────────

  { canonical: 'recepción hotelera', aliases: ['recepcionista de hotel', 'front desk', 'check-in check-out', 'recepción hotel', 'reservas hoteleras'], category: 'TECNICA', specialties: ['turismo', 'hotelería'] },
  { canonical: 'guía turístico', aliases: ['guía de turismo', 'guía local', 'tours', 'atención turistas'], category: 'TECNICA', specialties: ['turismo'] },
  { canonical: 'housekeeping', aliases: ['ama de llaves', 'limpieza hotelera', 'camarera de piso', 'gobierno de pisos'], category: 'TECNICA', specialties: ['hotelería'] },
  { canonical: 'agencia de viajes', aliases: ['operador turístico', 'paquetes turísticos', 'reservas de vuelos', 'operadora de turismo'], category: 'TECNICA', specialties: ['turismo'] },

  // ─── Prevención de Riesgos ────────────────────────────────────────────────

  { canonical: 'prevención de riesgos', aliases: ['prevención de riesgos laborales', 'seguridad laboral', 'seguridad e higiene', 'prevención de accidentes', 'prl', 'ohsas', 'iso 45001'], category: 'TECNICA', specialties: ['prevención de riesgos', 'construcción', 'mecánica', 'electricidad'] },
  { canonical: 'uso de epp', aliases: ['equipo de protección personal', 'epp', 'implementos de seguridad', 'equipos de seguridad'], category: 'TECNICA', specialties: ['prevención de riesgos', 'construcción', 'mecánica'] },
  { canonical: 'gestión de emergencias', aliases: ['plan de emergencia', 'evacuación', 'brigada de emergencia', 'simulacro', 'emergencias industriales'], category: 'TECNICA', specialties: ['prevención de riesgos'] },
  { canonical: 'identificación de riesgos', aliases: ['evaluación de riesgos', 'matriz de riesgo', 'análisis de riesgos', 'iper', 'identificación de peligros'], category: 'TECNICA', specialties: ['prevención de riesgos'] },

  // ─── Idiomas ──────────────────────────────────────────────────────────────

  { canonical: 'inglés', aliases: ['ingles', 'inglés básico', 'inglés intermedio', 'inglés avanzado', 'inglés técnico', 'inglés conversacional', 'english'], category: 'TECNICA', specialties: ['informática', 'ventas', 'turismo', 'administración'] },
  { canonical: 'inglés técnico', aliases: ['technical english', 'inglés para it', 'inglés informático', 'inglés de negocios'], category: 'TECNICA', specialties: ['informática', 'redes', 'mecánica'] },
  { canonical: 'portugués', aliases: ['portugues', 'portugués básico', 'portugués intermedio'], category: 'TECNICA', specialties: ['ventas', 'turismo', 'administración'] },

  // ─── Habilidades Blandas (transversales) ──────────────────────────────────

  { canonical: 'trabajo en equipo', aliases: ['trabajo colaborativo', 'colaboración', 'equipo de trabajo', 'teamwork', 'trabajo en grupo', 'trabajo grupal', 'cooperación', 'trabajo conjunto'], category: 'BLANDA' },
  { canonical: 'comunicación efectiva', aliases: ['comunicación', 'buena comunicación', 'habilidades comunicacionales', 'comunicación oral', 'comunicación escrita', 'comunicación asertiva', 'habilidades de comunicación'], category: 'BLANDA' },
  { canonical: 'proactividad', aliases: ['iniciativa', 'actitud proactiva', 'toma de iniciativa', 'disposición', 'automotivación', 'espíritu de iniciativa'], category: 'BLANDA' },
  { canonical: 'responsabilidad', aliases: ['compromiso', 'cumplimiento', 'puntualidad', 'responsable', 'cumplimiento de plazos', 'cumplimiento de tareas'], category: 'BLANDA' },
  { canonical: 'resolución de problemas', aliases: ['solución de problemas', 'pensamiento crítico', 'análisis de problemas', 'problem solving', 'pensamiento analítico', 'toma de decisiones'], category: 'BLANDA' },
  { canonical: 'adaptabilidad', aliases: ['flexibilidad', 'adaptación al cambio', 'polivalencia', 'versatilidad', 'apertura al cambio', 'resiliencia organizacional'], category: 'BLANDA' },
  { canonical: 'liderazgo', aliases: ['capacidad de liderazgo', 'lider', 'habilidades de liderazgo', 'gestión de equipos', 'conducción de equipos', 'liderazgo de equipos'], category: 'BLANDA' },
  { canonical: 'organización', aliases: ['gestión del tiempo', 'planificación', 'orden', 'organización del trabajo', 'administración del tiempo', 'manejo del tiempo', 'time management'], category: 'BLANDA' },
  { canonical: 'aprendizaje continuo', aliases: ['ganas de aprender', 'disposición al aprendizaje', 'curiosidad', 'aprendizaje rápido', 'capacitación continua', 'formación continua'], category: 'BLANDA' },
  { canonical: 'tolerancia al estrés', aliases: ['trabajo bajo presión', 'manejo del estrés', 'trabajo bajo estrés', 'resiliencia', 'estabilidad emocional', 'gestión del estrés'], category: 'BLANDA' },
  { canonical: 'honestidad', aliases: ['integridad', 'ética', 'valores', 'ética profesional', 'transparencia', 'honradez'], category: 'BLANDA' },
  { canonical: 'creatividad', aliases: ['innovación', 'pensamiento creativo', 'creatividad e innovación', 'pensamiento lateral', 'generación de ideas'], category: 'BLANDA' },
  { canonical: 'empatía', aliases: ['inteligencia emocional', 'habilidades interpersonales', 'trato con personas', 'relaciones interpersonales', 'orientación a las personas'], category: 'BLANDA' },
  { canonical: 'atención al detalle', aliases: ['meticulosidad', 'precisión', 'cuidado en el trabajo', 'rigurosidad', 'perfeccionismo positivo'], category: 'BLANDA' },
  { canonical: 'autogestión', aliases: ['trabajo autónomo', 'autonomía', 'independencia', 'iniciativa propia', 'trabajo independiente'], category: 'BLANDA' },
  { canonical: 'orientación a resultados', aliases: ['logro de objetivos', 'cumplimiento de metas', 'orientación al logro', 'enfoque en resultados'], category: 'BLANDA' },
  { canonical: 'habilidades de presentación', aliases: ['presentaciones en público', 'hablar en público', 'oratoria', 'presentaciones orales', 'expresión oral'], category: 'BLANDA' },
  { canonical: 'pensamiento crítico', aliases: ['análisis crítico', 'razonamiento crítico', 'juicio crítico', 'evaluación crítica'], category: 'BLANDA' },
  { canonical: 'colaboración remota', aliases: ['trabajo remoto', 'trabajo a distancia', 'home office', 'reuniones virtuales', 'equipos virtuales', 'trabajo híbrido'], category: 'BLANDA' },
  { canonical: 'multitarea', aliases: ['manejo de múltiples tareas', 'gestión de múltiples proyectos', 'capacidad multitarea', 'trabajo multitarea'], category: 'BLANDA' },
  { canonical: 'networking', aliases: ['relaciones profesionales', 'construcción de redes', 'red de contactos', 'contactos profesionales'], category: 'BLANDA' },
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/** Reverse index: alias → entry (all lowercase) */
const aliasIndex = new Map<string, SkillEntry>()

for (const entry of SKILLS_CATALOG) {
  aliasIndex.set(entry.canonical.toLowerCase(), entry)
  for (const alias of entry.aliases) {
    aliasIndex.set(alias.toLowerCase(), entry)
  }
}

/**
 * Normalizes a skill name to its catalog entry, or returns null if not found.
 * Tries exact match first, then partial containment.
 */
export function findSkillEntry(name: string): SkillEntry | null {
  const lower = name.trim().toLowerCase()

  // 1. Exact match
  if (aliasIndex.has(lower)) return aliasIndex.get(lower)!

  // 2. Partial match: the query contains the alias or the alias contains the query
  for (const [key, entry] of aliasIndex) {
    if (lower.includes(key) || key.includes(lower)) return entry
  }

  return null
}

/**
 * Returns the canonical name for a skill, or the original name if not in catalog.
 */
export function canonicalize(name: string): string {
  return findSkillEntry(name)?.canonical ?? name.trim().toLowerCase()
}
