# 💰 Gestor de Finanzas Personales

Aplicación web moderna, responsive e intuitiva diseñada para el control total de gastos personales, ingresos, presupuestos y salud financiera.

---

## 🚀 Características Principales

### 📊 Dashboard Financiero Interactivo
- **Indicadores Clave (KPIs)**: Saldo disponible, Ingresos mensuales, Gastos mensuales, Categoría con mayor gasto y Porcentaje de presupuesto consumido.
- **Comparativa respecto al mes anterior**: Indicadores dinámicos de variación en porcentaje (+/-%).
- **Gráfico de Dona (Recharts)**: Distribución visual de gastos por categoría con leyenda interactiva.
- **Gráfico de Barras**: Ingresos vs. Gastos mes a mes durante los últimos 6 meses.
- **Gráfico de Evolución de Saldo**: Trayectoria del patrimonio neto acumulado.
- **Acceso rápido**: Lista de últimas transacciones con acciones de edición y eliminación instantáneas.

### 💳 Transacciones y Movimientos
- Registro de **Ingresos (+)** y **Gastos (-)**.
- Formulario modal con selección de categoría, fecha, notas y monto.
- Búsqueda en tiempo real por palabras clave en descripción o notas.
- Filtros por tipo (Ingreso / Gasto), categoría, rango de fechas y rango de valores.
- Ordenamiento dinámico por fecha o monto.
- **Exportación a CSV**: Descarga en un clic de todas las transacciones filtradas.

### 🏷️ Categorías Personalizadas
- Categorías predeterminadas listadas: **Vivienda, Alimentación, Transporte, Servicios, Entretenimiento, Salud, Educación, Deudas, Compras y Otros**.
- Creación, edición y eliminación de categorías personalizadas con paleta de colores y catálogo de iconos.

### 🎯 Presupuestos y Alertas
- Presupuesto mensual general y límites individuales por categoría.
- Barras de progreso animadas en tiempo real.
- **Aviso preventivo al 80%** del límite asignado.
- **Alerta roja de sobrecosto** al superar el 100%.

### 🔐 Autenticación y Supabase
- Registro, inicio de sesión y recuperación de contraseña.
- Soporte para **Supabase (PostgreSQL con Row Level Security - RLS)** o **Modo Demo Persistent** inmediato sin necesidad de configuración previa.
- Aislamiento estricto de datos por usuario (`auth.uid()`).

### 🎨 Diseño y UX
- **Responsive**: Sidebar colapsable en escritorio y Bottom Navigation en móviles.
- **Soporte de Monedas**: Selector para USD ($), EUR (€), MXN ($), COP ($), etc.
- **Modo Claro y Oscuro**: Alternancia de tema persistente.
- **Microinteracciones**: Animaciones suaves alimentadas por Motion.
- **Notificaciones Toast y Modales de Confirmación**.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19, TypeScript, Vite.
- **Estilos**: Tailwind CSS.
- **Gráficos**: Recharts.
- **Animaciones**: Motion.
- **Manejo de Fechas**: date-fns.
- **Iconos**: Lucide Icons.
- **Base de Datos / Backend**: Supabase (PostgreSQL) + RLS policies.

---

## ⚡ Instalación y Ejecución Local

1. **Clonar el repositorio e instalar dependencias**:
```bash
npm install
```

2. **Ejecutar en modo desarrollo**:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## 🗄️ Configuración de Supabase (Opcional)

Si deseas conectar tu propio proyecto de Supabase:

1. Crea un nuevo proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** en Supabase y ejecuta todo el código del archivo `supabase-schema.sql` incluido en la raíz de este proyecto.
3. Copia tus credenciales en el archivo `.env` o configúralas directamente en la aplicación en **Configuración -> Conexión a Supabase**:
```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key"
```

---

## 📁 Estructura del Proyecto

```
/
├── supabase-schema.sql       # Esquema PostgreSQL completo + RLS + Triggers
├── README.md                 # Documentación y guía de configuración
├── .env.example              # Variables de entorno de ejemplo
├── src/
│   ├── components/           # Componentes modulares
│   │   ├── auth/             # Modales de autenticación
│   │   ├── budgets/          # Gestor de presupuestos y alertas
│   │   ├── categories/       # Creador/Editor de categorías
│   │   ├── dashboard/        # Widgets, tarjetas y gráficos
│   │   ├── layout/           # Navbar, Sidebar y BottomNav
│   │   ├── settings/         # Perfil y conexión Supabase
│   │   ├── transactions/     # Lista, filtros, CSV y formulario modal
│   │   └── ui/               # Componentes reutilizables (Toast, Modal, Confirm, Skeleton)
│   ├── context/              # Contextos de Autenticación y Finanzas
│   ├── lib/                  # Utilidades, constantes y cliente Supabase
│   └── types/                # Interfaces TypeScript
```
