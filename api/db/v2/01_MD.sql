--================================================================
-- v2 / 01_MD.sql
--
-- Cambios de esquema posteriores a la linea base.
--
USE SI_BDSqlSnapMonitor;
GO

--================================================================
-- Favorito: restriccion de unicidad (idUsuario, cSchema, cNombreObjeto)
--
-- La clave excluye cType (lo determina el par esquema + nombre) y
-- lVigente (cambia en cada reactivacion y es un soft delete).
--================================================================

SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

------------------------------------------------------------------
-- 1) Consolidar duplicados preexistentes.
--
-- Un UNIQUE no se puede crear si ya hay filas repetidas por esa
-- clave, asi que hay que dejar una sola.
--
-- Regla: sobrevive la fila de MAYOR dFecha (desempate: mayor
-- idFavorito) y queda vigente si ALGUNA de las repetidas lo estaba.
-- El resto se ELIMINA: no alcanza con bajarlas a lVigente = 0,
-- porque lVigente no forma parte de la clave.
------------------------------------------------------------------
;WITH Duplicados AS (
	SELECT
		idUsuario,
		cSchema,
		cNombreObjeto,
		MAX(CAST(lVigente AS TINYINT)) AS algunVigente
	FROM dbo.Favorito
	GROUP BY idUsuario, cSchema, cNombreObjeto
	HAVING COUNT(*) > 1
)
UPDATE F
	SET lVigente = Duplicados.algunVigente
FROM dbo.Favorito F
INNER JOIN Duplicados
	ON Duplicados.idUsuario      = F.idUsuario
	AND Duplicados.cSchema       = F.cSchema
	AND Duplicados.cNombreObjeto = F.cNombreObjeto;

;WITH Ranking AS (
	SELECT
		idFavorito,
		ROW_NUMBER() OVER (
			PARTITION BY idUsuario, cSchema, cNombreObjeto
			ORDER BY dFecha DESC, idFavorito DESC
		) AS orden
	FROM dbo.Favorito
)
DELETE F
FROM dbo.Favorito F
INNER JOIN Ranking ON Ranking.idFavorito = F.idFavorito
WHERE Ranking.orden > 1;

------------------------------------------------------------------
-- 2) Crear la restriccion.
------------------------------------------------------------------
IF NOT EXISTS (
	SELECT 1
	FROM sys.key_constraints
	WHERE name = 'UQ_Favorito_Usuario_Objeto'
		AND parent_object_id = OBJECT_ID('dbo.Favorito')
)
BEGIN
	ALTER TABLE dbo.Favorito
		ADD CONSTRAINT UQ_Favorito_Usuario_Objeto
		UNIQUE (idUsuario, cSchema, cNombreObjeto);
END

COMMIT TRANSACTION;

------------------------------------------------------------------
-- 3) Documentacion de la restriccion.
------------------------------------------------------------------
IF NOT EXISTS (
	SELECT 1
	FROM sys.extended_properties
	WHERE name = 'Description'
		AND major_id = OBJECT_ID('dbo.Favorito')
		AND minor_id = (
			SELECT object_id
			FROM sys.key_constraints
			WHERE name = 'UQ_Favorito_Usuario_Objeto'
		)
)
BEGIN
	EXEC sp_addextendedproperty
		@name = N'Description',
		@value = N'Garantiza que un usuario tenga un solo favorito por objeto (esquema + nombre).',
		@level0type = N'SCHEMA', @level0name = N'dbo',
		@level1type = N'TABLE',  @level1name = N'Favorito',
		@level2type = N'CONSTRAINT', @level2name = N'UQ_Favorito_Usuario_Objeto';
END
