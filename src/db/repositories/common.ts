export interface InsertEntity<NewE> {
  insert: (entity: NewE) => Promise<number>
  insertMany: (entities: NewE[]) => Promise<number[]>
}
