--================================================================
-- v3 / 01_MD.sql
--
-- Alcance de favoritos (global / servidor / base).
--
-- DDL: crea dbo.FavoriteScope, conecta dbo.Favorito con el alcance y
-- reemplaza la unicidad vieja (usuario + esquema + nombre) por la nueva
-- (usuario + alcance + esquema + nombre).
--
-- No rompiente: el codigo actual nunca manda el alcance, asi que todas
-- las filas existentes caen en el alcance global (id = 0) y el
-- comportamiento actual se mantiene.
--
-- Este script deja todo el estado estructural que necesita (incluida la
-- fila reservada id = 0), asi que no depende de ningun DML posterior.
--================================================================
USE SI_BDSqlSnapMonitor;
GO

SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

------------------------------------------------------------------
-- 1) Tabla de alcance.
------------------------------------------------------------------
IF OBJECT_ID('dbo.FavoriteScope', 'U') IS NULL
BEGIN
	CREATE TABLE dbo.FavoriteScope (
		FavoriteScopeId INT IDENTITY(1,1) NOT NULL
			CONSTRAINT PK_FavoriteScope PRIMARY KEY,
		ServerName      VARCHAR(64) NULL,   -- @@SERVERNAME (instancia), no el alias del usuario; NULL = todos los servidores
		DatabaseName    VARCHAR(64) NULL,   -- NULL = aplica a todas las bases del servidor
		IsActive        BIT NOT NULL CONSTRAINT DF_FavoriteScope_IsActive DEFAULT 1,
		CreatedAt       DATETIME NOT NULL CONSTRAINT DF_FavoriteScope_CreatedAt DEFAULT GETUTCDATE(),
		CONSTRAINT CK_FavoriteScope_Hierarchy
			CHECK (DatabaseName IS NULL OR ServerName IS NOT NULL),
		CONSTRAINT UQ_FavoriteScope_Server_Database
			UNIQUE (ServerName, DatabaseName)
	);
END

------------------------------------------------------------------
-- 2) Fila reservada id = 0 = alcance global.
--
-- Es estructural, no data de negocio: la FK de Favorito exige que el 0
-- exista, y la FK se crea en este mismo script. Por eso va aca y no en
-- 04_DT (que corre despues).
------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.FavoriteScope WHERE FavoriteScopeId = 0)
BEGIN
	SET IDENTITY_INSERT dbo.FavoriteScope ON;
	INSERT INTO dbo.FavoriteScope (FavoriteScopeId, ServerName, DatabaseName, IsActive)
	VALUES (0, NULL, NULL, 1);
	SET IDENTITY_INSERT dbo.FavoriteScope OFF;
	DBCC CHECKIDENT ('dbo.FavoriteScope', RESEED, 0);
END

------------------------------------------------------------------
-- 3) Columna de alcance en Favorito. Default 0 = global.
------------------------------------------------------------------
IF COL_LENGTH('dbo.Favorito', 'FavoriteScopeId') IS NULL
BEGIN
	ALTER TABLE dbo.Favorito
		ADD FavoriteScopeId INT NOT NULL
			CONSTRAINT DF_Favorito_FavoriteScope DEFAULT 0;
END

-- GO obligatorio: SQL Server resuelve los nombres de COLUMNA al compilar el
-- batch completo, no de forma diferida como los de tabla. Sin este corte, el
-- batch que sigue (FK/indice/dedupe) referencia FavoriteScopeId antes de que
-- exista y falla con "Invalid column name". La transaccion continua abierta
-- a traves del GO.
GO

------------------------------------------------------------------
-- 4) FK al alcance + indice de apoyo (SQL Server no lo crea solo).
------------------------------------------------------------------
IF NOT EXISTS (
	SELECT 1 FROM sys.foreign_keys
	WHERE name = 'FK_Favorito_FavoriteScope'
		AND parent_object_id = OBJECT_ID('dbo.Favorito')
)
BEGIN
	ALTER TABLE dbo.Favorito
		ADD CONSTRAINT FK_Favorito_FavoriteScope
		FOREIGN KEY (FavoriteScopeId) REFERENCES dbo.FavoriteScope(FavoriteScopeId);
END

IF NOT EXISTS (
	SELECT 1 FROM sys.indexes
	WHERE name = 'IX_Favorito_FavoriteScope'
		AND object_id = OBJECT_ID('dbo.Favorito')
)
BEGIN
	CREATE NONCLUSTERED INDEX IX_Favorito_FavoriteScope
		ON dbo.Favorito (FavoriteScopeId);
END

------------------------------------------------------------------
-- 5) Consolidar duplicados por la clave NUEVA
--    (usuario + alcance + esquema + nombre).
--
-- Un UNIQUE no se puede crear si ya hay filas repetidas por esa clave,
-- asi que hay que dejar una sola. Con la clave nueva, la columna recien
-- agregada vale 0 para todas las filas, asi que equivale a la clave vieja.
--
-- Regla: sobrevive la fila de MAYOR dFecha (desempate: mayor idFavorito)
-- y queda vigente si ALGUNA de las repetidas lo estaba. El resto se
-- ELIMINA: no alcanza con bajarlas a lVigente = 0, porque lVigente no
-- forma parte de la clave.
------------------------------------------------------------------
;WITH Duplicados AS (
	SELECT
		idUsuario,
		FavoriteScopeId,
		cSchema,
		cNombreObjeto,
		MAX(CAST(lVigente AS TINYINT)) AS algunVigente
	FROM dbo.Favorito
	GROUP BY idUsuario, FavoriteScopeId, cSchema, cNombreObjeto
	HAVING COUNT(*) > 1
)
UPDATE F
	SET lVigente = Duplicados.algunVigente
FROM dbo.Favorito F
INNER JOIN Duplicados
	ON Duplicados.idUsuario       = F.idUsuario
	AND Duplicados.FavoriteScopeId = F.FavoriteScopeId
	AND Duplicados.cSchema         = F.cSchema
	AND Duplicados.cNombreObjeto   = F.cNombreObjeto;

;WITH Ranking AS (
	SELECT
		idFavorito,
		ROW_NUMBER() OVER (
			PARTITION BY idUsuario, FavoriteScopeId, cSchema, cNombreObjeto
			ORDER BY dFecha DESC, idFavorito DESC
		) AS orden
	FROM dbo.Favorito
)
DELETE F
FROM dbo.Favorito F
INNER JOIN Ranking ON Ranking.idFavorito = F.idFavorito
WHERE Ranking.orden > 1;

------------------------------------------------------------------
-- 6) Reemplazar la constraint vieja por la que incluye el alcance.
------------------------------------------------------------------
IF EXISTS (
	SELECT 1 FROM sys.key_constraints
	WHERE name = 'UQ_Favorito_Usuario_Objeto'
		AND parent_object_id = OBJECT_ID('dbo.Favorito')
)
BEGIN
	ALTER TABLE dbo.Favorito DROP CONSTRAINT UQ_Favorito_Usuario_Objeto;
END

IF NOT EXISTS (
	SELECT 1 FROM sys.key_constraints
	WHERE name = 'UQ_Favorito_Usuario_Scope_Objeto'
		AND parent_object_id = OBJECT_ID('dbo.Favorito')
)
BEGIN
	ALTER TABLE dbo.Favorito
		ADD CONSTRAINT UQ_Favorito_Usuario_Scope_Objeto
		UNIQUE (idUsuario, FavoriteScopeId, cSchema, cNombreObjeto);
END

COMMIT TRANSACTION;

------------------------------------------------------------------
-- 7) Documentacion.
------------------------------------------------------------------
IF NOT EXISTS (
	SELECT 1 FROM sys.extended_properties
	WHERE name = 'Description'
		AND major_id = OBJECT_ID('dbo.FavoriteScope')
		AND minor_id = 0
)
BEGIN
	EXEC sp_addextendedproperty
		@name = N'Description',
		@value = N'Define el alcance de un favorito: global (ambos NULL), por servidor (solo ServerName) o por base (ServerName + DatabaseName).',
		@level0type = N'SCHEMA', @level0name = N'dbo',
		@level1type = N'TABLE',  @level1name = N'FavoriteScope';

	EXEC sp_addextendedproperty
		@name = N'Description',
		@value = N'Identificador unico del alcance. 0 = alcance global reservado.',
		@level0type = N'SCHEMA', @level0name = N'dbo',
		@level1type = N'TABLE',  @level1name = N'FavoriteScope',
		@level2type = N'COLUMN', @level2name = N'FavoriteScopeId';

	EXEC sp_addextendedproperty
		@name = N'Description',
		@value = N'Nombre de la instancia devuelto por @@SERVERNAME (no el alias/host que tipea el usuario). NULL = aplica a todos los servidores.',
		@level0type = N'SCHEMA', @level0name = N'dbo',
		@level1type = N'TABLE',  @level1name = N'FavoriteScope',
		@level2type = N'COLUMN', @level2name = N'ServerName';

	EXEC sp_addextendedproperty
		@name = N'Description',
		@value = N'Nombre de la base. NULL (con ServerName) significa que aplica a todas las bases del servidor.',
		@level0type = N'SCHEMA', @level0name = N'dbo',
		@level1type = N'TABLE',  @level1name = N'FavoriteScope',
		@level2type = N'COLUMN', @level2name = N'DatabaseName';

	EXEC sp_addextendedproperty
		@name = N'Description',
		@value = N'Indica si el alcance esta vigente. Valores: 1 = vigente, 0 = no vigente.',
		@level0type = N'SCHEMA', @level0name = N'dbo',
		@level1type = N'TABLE',  @level1name = N'FavoriteScope',
		@level2type = N'COLUMN', @level2name = N'IsActive';

	EXEC sp_addextendedproperty
		@name = N'Description',
		@value = N'Fecha y hora en que se creo el alcance.',
		@level0type = N'SCHEMA', @level0name = N'dbo',
		@level1type = N'TABLE',  @level1name = N'FavoriteScope',
		@level2type = N'COLUMN', @level2name = N'CreatedAt';
END

IF NOT EXISTS (
	SELECT 1 FROM sys.extended_properties
	WHERE name = 'Description'
		AND major_id = OBJECT_ID('dbo.Favorito')
		AND minor_id = COLUMNPROPERTY(OBJECT_ID('dbo.Favorito'), 'FavoriteScopeId', 'ColumnId')
)
BEGIN
	EXEC sp_addextendedproperty
		@name = N'Description',
		@value = N'Alcance del favorito. Referencia a FavoriteScope; 0 = global (aplica a toda base y servidor).',
		@level0type = N'SCHEMA', @level0name = N'dbo',
		@level1type = N'TABLE',  @level1name = N'Favorito',
		@level2type = N'COLUMN', @level2name = N'FavoriteScopeId';
END

IF NOT EXISTS (
	SELECT 1 FROM sys.extended_properties
	WHERE name = 'Description'
		AND major_id = OBJECT_ID('dbo.Favorito')
		AND minor_id = (
			SELECT object_id FROM sys.key_constraints
			WHERE name = 'UQ_Favorito_Usuario_Scope_Objeto'
		)
)
BEGIN
	EXEC sp_addextendedproperty
		@name = N'Description',
		@value = N'Garantiza un solo favorito por usuario, alcance y objeto (esquema + nombre).',
		@level0type = N'SCHEMA', @level0name = N'dbo',
		@level1type = N'TABLE',  @level1name = N'Favorito',
		@level2type = N'CONSTRAINT', @level2name = N'UQ_Favorito_Usuario_Scope_Objeto';
END
GO
