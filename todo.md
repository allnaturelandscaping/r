# LawnPro - Gestión de Cortes

## Base de datos y backend
- [x] Esquema: tabla `clients` (nombre, dirección, teléfono, frecuencia)
- [x] Esquema: tabla `scheduled_cuts` (clientId, scheduledDate, status, completedAt, notes)
- [x] Migración SQL aplicada y verificada
- [x] Query helpers en server/db.ts para clientes y cortes
- [x] Router tRPC: clients.list, clients.create, clients.update, clients.delete
- [x] Router tRPC: cuts.today (cortes de hoy con urgencia)
- [x] Router tRPC: cuts.complete (marcar completado + auto-programar siguiente)
- [x] Router tRPC: cuts.calendar (cortes del mes por fecha)
- [x] Router tRPC: cuts.history (historial por cliente)
- [x] Router tRPC: cuts.upcoming (próximos 7 días)
- [x] Lógica de auto-programación: semanal (+7d), quincenal (+14d), mensual (+30d)

## Frontend - Páginas
- [x] AppLayout personalizado con navegación lateral para iPad
- [x] Página: Dashboard diario con indicadores de urgencia
- [x] Página: Gestión de clientes (lista + formulario agregar/editar)
- [x] Página: Calendario mensual con cortes programados
- [x] Página: Historial de cortes por cliente
- [x] Página: Detalle de cliente con historial integrado

## UI/UX iPad
- [x] Paleta de colores elegante (verde oscuro + crema + dorado)
- [x] Fuentes Google: Inter para UI + Playfair Display para títulos
- [x] Botones grandes optimizados para touch (min 48px)
- [x] Sidebar de navegación lateral con íconos grandes
- [x] Estados vacíos con mensajes descriptivos
- [x] Indicadores de urgencia: rojo (vencido), amarillo (hoy), verde (programado)
- [x] Modo PWA: manifest.json y meta tags para iPad
- [x] Responsive: sidebar en desktop, top bar en tablet/móvil

## Calidad
- [x] Tests vitest para lógica de auto-programación (7 tests)
- [x] Tests vitest para validación de clientes (8 tests)
- [x] Test de logout existente (1 test)
- [x] Total: 16 tests pasando
