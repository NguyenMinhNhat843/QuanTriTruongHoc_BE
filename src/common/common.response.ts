export class ResponsePagination<T> {
  data: T[];
  meta: {
    total: number;
  };
}
