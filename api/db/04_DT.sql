--====================================
--INSERTAR TIPOS DE ACCION TipoAccion
--====================================
IF NOT EXISTS(SELECT 1 FROM dbo.TipoAccion WHERE cNombre = 'BUSQUEDA REGULAR')
BEGIN
	INSERT INTO dbo.TipoAccion (cNombre, cDescripcion, lVigente) VALUES ('BUSQUEDA REGULAR', 'Búsqueda y recuperación de un objeto SQL de manera regular', 1)
END

IF NOT EXISTS(SELECT 1 FROM dbo.TipoAccion WHERE cNombre = 'COMPARACION')
BEGIN
	INSERT INTO dbo.TipoAccion (cNombre, cDescripcion, lVigente) VALUES ('COMPARACION', 'Búsqueda y recuperación de un objeto SQL cuando se hace click en COMPARAR', 1)
END

