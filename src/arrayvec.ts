import { Option, Result } from "@rusts/std";

export const CAPACITY_ERROR = "CapacityError: insufficient capacity";

export class ArrayVec<T> {
  private _xs: T[];
  private _capacity: number;
  private _len: number;

  constructor(capacity: number) {
    this._xs = [];
    this._capacity = capacity;
    this._len = 0;
  }

  [Symbol.iterator](): ArrayVecIter<T> {
    return this.iter();
  }

  len(): number {
    return this._len;
  }

  capacity(): number {
    return this._capacity;
  }

  get(index: number): Option<T> {
    if (index >= this.len() || index < 0) {
      return Option.None();
    }
    return Option.Some(this._xs[index]);
  }

  iter(): ArrayVecIter<T> {
    return new ArrayVecIter(this);
  }

  sort<F extends (a: T, b: T) => number>(compare: F) {
    return this._xs.sort(compare);
  }

  is_full(): boolean {
    return this.len() === this.capacity();
  }

  push(element: T) {
    this.try_push(element).unwrap();
  }

  try_push(element: T): Result<void, T> {
    if (this.len() < this.capacity()) {
      this.push_unchecked(element);
      return Result.Ok(undefined);
    } else {
      return Result.Err(CAPACITY_ERROR, element);
    }
  }

  push_unchecked(element: T) {
    let len = this.len();
    this._xs.push(element);
    this.set_len(len + 1);
  }

  insert(index: number, element: T) {
    this.try_insert(index, element).unwrap();
  }

  try_insert(index: number, element: T): Result<void, T> {
    if (index > this.len() || index < 0) {
      panic_oob("try_insert", index, this.len());
    }
    if (this.len() === this.capacity()) {
      return Result.Err(CAPACITY_ERROR, element);
    }
    let len = this.len();

    this._xs.splice(index, 0, element);
    this.set_len(len + 1);
    return Result.Ok(undefined);
  }

  pop(): Option<T> {
    let len = this.len();
    if (len === 0) {
      return Option.None();
    }
    let new_len = len - 1;
    this.set_len(new_len);
    return Option.Some(this._xs.pop() as T);
  }

  async swap_remove(index: number): Promise<T | void> {
    return this.swap_pop(index).unwrapOrElse(async () => {
      panic_oob("swap_remove", index, this.len());
    });
  }

  swap_pop(index: number): Option<T> {
    let len = this.len();
    if (index >= this.len() || index < 0) {
      return Option.None();
    }
    [this._xs[index], this._xs[len - 1]] = [this._xs[len - 1], this._xs[index]];
    return this.pop();
  }

  async remove(index: number): Promise<T | void> {
    return await this.pop_at(index).unwrapOrElse(async () => {
      panic_oob("remove", index, this.len());
    });
  }

  pop_at(index: number): Option<T> {
    if (index >= this.len() || index < 0) {
      return Option.None();
    } else {
      return Option.Some(this.drain([index, index + 1])[0]);
    }
  }

  truncate(len: number) {
    while (this.len() > len) {
      this.pop();
    }
  }

  clear() {
    while (this.pop().isSome()) {}
  }

  retain<F extends (element: T) => boolean>(f: F) {
    let len = this.len();
    let del = 0;
    {
      for (let i = 0; i < len; ++i) {
        if (!f(this._xs[i])) {
          del += 1;
        } else if (del > 0) {
          [this._xs[i - del], this._xs[i]] = [this._xs[i], this._xs[i - del]];
        }
      }
    }
    if (del > 0) {
      this.drain([len - del, len]);
    }
  }

  set_len(length: number) {
    if (length <= this.capacity()) {
      throw new Error(
        `ArrayVec.set_len: length ${length} is greater than capacity ${this.capacity()}`
      );
    }
    this._len = length;
  }

  drain(range: [number, number]): T[] {
    let len = this.len();
    let start = range[0];
    let end = range[1];

    this.set_len(start);
    return this._xs.splice(start, end);
  }

  into_inner(): Result<T[], ArrayVec<T>> {
    if (this.len() < this.capacity()) {
      return Result.Err(
        `ArrayVec.into_inner: length ${this.len()} is less than capacity ${this.capacity()}`,
        this
      );
    } else {
      return Result.Ok([...this._xs]);
    }
  }

  as_slice(): T[] {
    return [...this._xs];
  }
}

export class ArrayVecIter<T> implements Iterator<Option<T>> {
  index: number;
  v: ArrayVec<T>;

  constructor(v: ArrayVec<T>) {
    this.index = 0;
    this.v = v;
  }

  next(): IteratorResult<Option<T>> {
    if (this.index === this.v.len()) {
      return {
        done: true,
        value: Option.None()
      };
    } else {
      let index = this.index;
      this.index += 1;
      return {
        done: false,
        value: this.v.get(index)
      };
    }
  }
}

function panic_oob(method_name: string, index: number, len: number) {
  throw new Error(
    `ArrayVec.${method_name}: index ${index} is out of bounds in vector of length ${len}`
  );
}
