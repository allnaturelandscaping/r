-- Migración: Reemplazar auth de Manus con Google OAuth + sistema de aprobación
-- Ejecutar solo si estás migrando desde la versión anterior con openId/passwordHash

-- Opción A: Base de datos nueva (recomendado)
-- Ejecuta drizzle-kit push para crear las tablas desde cero.

-- Opción B: Migración desde schema anterior
-- ALTER TABLE users
--   DROP COLUMN openId,
--   DROP COLUMN passwordHash,
--   ADD COLUMN googleId VARCHAR(128) NOT NULL UNIQUE AFTER id,
--   ADD COLUMN avatarUrl TEXT AFTER name,
--   ADD COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' AFTER role,
--   MODIFY COLUMN email VARCHAR(320) NOT NULL UNIQUE;

-- Nota: Para una base de datos nueva, usa:
-- pnpm db:push
