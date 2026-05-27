import { ForSysObjectRetrievalPort } from '@sysobject/domain/ports/drivers/for-sysobject-retrieval.port'
import { LogObjectContext, LogProdObjectContext } from '@sysobject/domain/schemas/log-object-context'
import { PermissionRol } from '@sysobject/domain/schemas/permission-rol'
import { SysObject, SysObjectDependency, SysObjectDependent, SysObjectSummary, TypeSysObject } from '@sysobject/domain/schemas/sysobject'
import { Usertable } from '@sysobject/domain/schemas/usertable'

import { GetProdSysObjectUseCase } from './use-cases/get-prod-sysobject.use-case'
import { GetSysObjectUseCase } from './use-cases/get-sysobject.use-case'
import { GetSysObjectDependenciesUseCase } from './use-cases/get-sysobject-dependencies.use-case'
import { GetSysObjectDependentsUseCase } from './use-cases/get-sysobject-dependents.use-case'
import { GetSysUsertableUseCase } from './use-cases/get-sysusertable.use-case'
import { SearchSuggestionsUseCase } from './use-cases/search-suggestions.use-case'
export class SysObjectService implements ForSysObjectRetrievalPort {
  constructor(
    private readonly getSysObjectUC: GetSysObjectUseCase,
    private readonly searchSuggestionsUC: SearchSuggestionsUseCase,
    private readonly getSysUsertableUC: GetSysUsertableUseCase,
    private readonly getProdSysObjectUC: GetProdSysObjectUseCase,
    private readonly getSysObjectDependentsUC: GetSysObjectDependentsUseCase,
    private readonly getSysObjectDependenciesUC: GetSysObjectDependenciesUseCase,
  ) {}

  async getSysObjectBySchemaAndName(
    schema: string,
    name: string,
    log: LogObjectContext,
  ): Promise<SysObject & { permission: PermissionRol[] }> {
    return this.getSysObjectUC.executeBySchemaAndName(schema, name, log)
  }

  async searchSuggestions(name: string, type: TypeSysObject): Promise<SysObjectSummary[]> {
    return this.searchSuggestionsUC.execute(name, type)
  }

  async getSysUsertableBySchemaAndName(schema: string, name: string, log: LogObjectContext): Promise<Usertable> {
    return this.getSysUsertableUC.executeBySchemaAndName(schema, name, log)
  }

  async getProdSysObject(
    name: string,
    schema: string,
    actionType: number,
    log: LogProdObjectContext,
  ): Promise<SysObject & { permission: PermissionRol[] }> {
    return this.getProdSysObjectUC.execute(name, schema, actionType, log)
  }

  async getSysObjectDependents(name: string, schema: string): Promise<SysObjectDependent[]> {
    return this.getSysObjectDependentsUC.execute(name, schema)
  }

  async getSysObjectDependencies(name: string, schema: string): Promise<SysObjectDependency[]> {
    return this.getSysObjectDependenciesUC.execute(name, schema)
  }
}
