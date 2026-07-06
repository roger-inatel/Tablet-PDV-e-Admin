// Domain errors mirroring the HTTP status codes the future NestJS backend
// will return. The mock repos throw these; the store maps them to UX
// (e.g. ConflictError -> toast + refetch). See docs/CONTRACTS.md.

export class ConflictError extends Error {
  readonly code = 409;
  constructor(
    public readonly entity: string,
    public readonly expected: number,
    public readonly actual: number,
  ) {
    super(`${entity}: versão esperada ${expected}, versão atual ${actual}`);
    this.name = "ConflictError";
  }
}

export class ForbiddenError extends Error {
  readonly code = 403;
  constructor(message = "Ação não permitida") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class InvalidTransitionError extends Error {
  readonly code = 422;
  constructor(
    public readonly entity: string,
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`${entity}: transição inválida ${from} → ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export class NotFoundError extends Error {
  readonly code = 404;
  constructor(entity: string, id: string | number) {
    super(`${entity} ${id} não encontrado(a)`);
    this.name = "NotFoundError";
  }
}

export function isConflictError(e: unknown): e is ConflictError {
  return e instanceof ConflictError;
}
