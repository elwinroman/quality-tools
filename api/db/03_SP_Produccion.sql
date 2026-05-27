IF EXISTS (
	SELECT 1 FROM sys.objects 
	WHERE OBJECT_ID = OBJECT_ID(N'[dbo].[SYS_ObtenerDefinicionSQL_SP]') 
	AND TYPE IN ( N'P', N'PC' ) 
)
BEGIN
	DROP PROCEDURE [dbo].[SYS_ObtenerDefinicionSQL_SP]
END

GO
CREATE PROCEDURE [dbo].[SYS_ObtenerDefinicionSQL_SP]
	@object_name	VARCHAR(128),	-- nombre del objeto
	@schema_name	VARCHAR(64)		-- nombre del esquema
AS
SET NOCOUNT ON
BEGIN
	SELECT
		A.object_id,
		A.name,
		A.type,
		A.type_desc,
		B.schema_id,
		B.name AS schema_name,
		A.create_date,
		A.modify_date,
		C.definition
	FROM sys.objects            A
	INNER JOIN sys.schemas      B ON B.schema_id = A.schema_id
	INNER JOIN sys.sql_modules  C ON C.object_id = A.object_id
	WHERE type IN('P','FN','R','RF','TR','IF','TF','V')
		AND A.name = @object_name AND B.name = @schema_name
END

GO
--GRANT EXECUTE ON [SYS_ObtenerDefinicionSQL_SP] TO [Rol]
--GO

IF EXISTS (
	SELECT 1 FROM sys.objects 
	WHERE OBJECT_ID = OBJECT_ID(N'[dbo].[SYS_ObtenerRoles_SP]') 
	AND TYPE IN ( N'P', N'PC' ) 
)
BEGIN
	DROP PROCEDURE [dbo].[SYS_ObtenerRoles_SP]
END

GO
CREATE PROCEDURE [dbo].[SYS_ObtenerRoles_SP]
	@id		INT	-- id del objeto
AS
SET NOCOUNT ON
BEGIN
	SELECT 
		A.state_desc,
		A.permission_name, 
		C.name AS rol
	FROM sys.database_permissions		A
	INNER JOIN sys.objects				B ON B.object_id = A.major_id
	INNER JOIN sys.database_principals	C ON C.principal_id = A.grantee_principal_id
	WHERE B.object_id = @id
END

GO
--GRANT EXECUTE ON [SYS_ObtenerRoles_SP] TO [Rol]
--GO
