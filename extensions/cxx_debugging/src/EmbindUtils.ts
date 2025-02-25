import type * as SymbolsBackend from './SymbolsBackend.js';

export function mapVector<T, ApiT>(vector: SymbolsBackend.Vector<ApiT>, callback: (apiElement: ApiT) => T): T[] {
  const elements: T[] = [];
  for (let i = 0; i < vector.size(); ++i) {
    const element = vector.get(i);
    elements.push(callback(element));
  }
  return elements;
}
  
export function createEmbindPool(): {
  flush(): void,
  manage<T extends SymbolsBackend.EmbindObject|undefined>(object: T): T,
  unmanage<T extends SymbolsBackend.EmbindObject>(object: T): boolean,
} {
  class EmbindObjectPool {
    private objectPool: SymbolsBackend.EmbindObject[] = [];

    flush(): void {
      for (const object of this.objectPool.reverse()) {
        object.delete();
      }
      this.objectPool = [];
    }

    manage<T extends SymbolsBackend.EmbindObject|undefined>(object: T): T {
      if (typeof object !== 'undefined') {
        this.objectPool.push(object as SymbolsBackend.EmbindObject);
      }
      return object;
    }

    unmanage<T extends SymbolsBackend.EmbindObject>(object: T): boolean {
      const index = this.objectPool.indexOf(object);
      if (index > -1) {
        this.objectPool.splice(index, 1);
        object.delete();
        return true;
      }
      return false;
    }
  }

  const pool = new EmbindObjectPool();
  const manage = pool.manage.bind(pool);
  const unmanage = pool.unmanage.bind(pool);
  const flush = pool.flush.bind(pool);
  return {manage, unmanage, flush};
}

export function stringifyErrorCode(errorCode: SymbolsBackend.ErrorCode, backend: SymbolsBackend.Module): string {
  switch (errorCode) {
    case backend.ErrorCode.PROTOCOL_ERROR:
      return 'ProtocolError:';
    case backend.ErrorCode.MODULE_NOT_FOUND_ERROR:
      return 'ModuleNotFoundError:';
    case backend.ErrorCode.INTERNAL_ERROR:
      return 'InternalError';
    case backend.ErrorCode.EVAL_ERROR:
      return 'EvalError';
  }
  throw new Error(`InternalError: Invalid error code ${errorCode}`);
}
