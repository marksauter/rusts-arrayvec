import {
  // Self
  Self,
  // Range
  Range,
  range,
  // Option
  Option,
  None,
  Some,
  // Result
  Result,
  Ok,
  Err,
  // Iterator
  ExactSizeAndDoubleEndedIterator,
  IntoIterator,
  // traits
  Clone,
  Debug,
  ImplPartialEq,
  ImplEq,
  ImplPartialOrd,
  ImplOrd,
  // Ordering
  Ordering,
  // funtions
  clone,
  cmp,
  partial_cmp,
  debug_assert,
  eq,
  format
} from "@rusts/std";

export class ArrayVec<T> extends ImplOrd(ImplPartialOrd(ImplEq(ImplPartialEq(Self))))
  implements Clone, Debug {
  public Self!: ArrayVec<T>;

  private _xs: T[];
  private _capacity: number;
  private _len: number;

  constructor(capacity: number) {
    super();
    this._xs = [];
    this._capacity = capacity;
    this._len = 0;
  }

  static from<T>(array: T[]): ArrayVec<T> {
    let ret: ArrayVec<T> = new ArrayVec(array.length);
    ret._xs = clone(array);
    ret._len = array.length;
    return ret;
  }

  private swap(i1: number, i2: number) {
    let len = this.len();
    if (!(i1 >= 0 && i1 < len)) {
      panic_oob("swap", i1, len);
    } else if (!(i2 >= 0 && i2 < len)) {
      panic_oob("swap", i2, len);
    }
    [this._xs[i1], this._xs[i2]] = [this._xs[i2], this._xs[i1]];
  }

  public len(): number {
    return this._len;
  }

  public capacity(): number {
    return this._capacity;
  }

  public get(index: number): Option<T> {
    if (index >= 0 && index < this.len()) {
      return Some(this._xs[index]);
    }
    return None();
  }

  public get_unchecked(index: number) {
    let len = this.len();
    debug_assert(index >= 0 && index < len);
    return this._xs[index];
  }

  public set(index: number, element: T) {
    this.try_set(index, element).unwrap();
  }

  public try_set(index: number, element: T): Result<undefined, string> {
    let len = this.len();
    if (index >= 0 && index < len) {
      this.set_unchecked(index, element);
      return Ok(undefined);
    } else {
      return Err(`index ${index} is out of bounds in vector of length ${len}`);
    }
  }

  public set_unchecked(index: number, element: T) {
    let len = this.len();
    debug_assert(index >= 0 && index < len);
    this._xs[index] = element;
  }

  public into_iter(): ArrayVecIntoIter<T> {
    return new ArrayVecIntoIter(this);
  }

  public [Symbol.iterator](): Iterator<T> {
    return this.into_iter()[Symbol.iterator]();
  }

  public slice(start: number, end?: number): T[] {
    return this._xs.slice(start, end);
  }

  public sort(compare: (a: T, b: T) => number) {
    return this._xs.sort(compare);
  }

  public is_full(): boolean {
    return this.len() === this.capacity();
  }

  public remaining_capacity(): number {
    return this.capacity() - this.len();
  }

  public push(element: T) {
    this.try_push(element).unwrap();
  }

  public try_push(element: T): Result<undefined, CapacityError<T>> {
    if (this.len() < this.capacity()) {
      this.push_unchecked(element);
      return Ok(undefined);
    } else {
      return Err(new CapacityError(element));
    }
  }

  public push_unchecked(element: T) {
    let len = this.len();
    debug_assert(len < this.capacity());
    this._xs.push(element);
    this.set_len(len + 1);
  }

  public insert(index: number, element: T) {
    this.try_insert(index, element).unwrap();
  }

  public try_insert(index: number, element: T): Result<undefined, CapacityError<T>> {
    if (index > this.len() || index < 0) {
      panic_oob("try_insert", index, this.len());
    }
    if (this.len() === this.capacity()) {
      return Err(new CapacityError(element));
    }
    let len = this.len();

    this._xs.splice(index, 0, element);
    this.set_len(len + 1);
    return Ok(undefined);
  }

  public pop(): Option<T> {
    let len = this.len();
    if (len === 0) {
      return None();
    }
    let new_len = len - 1;
    this.set_len(new_len);
    return Some(this._xs.pop() as T);
  }

  public swap_remove(index: number): T {
    return this.swap_pop(index).unwrap_or_else(() => {
      // Unreachable code
      panic_oob("swap_remove", index, this.len());
      return (undefined as unknown) as T;
    });
  }

  public swap_pop(index: number): Option<T> {
    let len = this.len();
    if (index >= this.len() || index < 0) {
      return None();
    }
    this.swap(index, len - 1);
    return this.pop();
  }

  public remove(index: number): T {
    return this.pop_at(index).unwrap_or_else(() => {
      // Unreachable code
      panic_oob("remove", index, this.len());
      return (undefined as unknown) as T;
    });
  }

  public pop_at(index: number): Option<T> {
    if (index >= this.len() || index < 0) {
      return None();
    } else {
      return Some(this.drain(range(index, index + 1))[0]);
    }
  }

  public truncate(len: number) {
    while (this.len() > len) {
      this.pop();
    }
  }

  public clear() {
    while (this.pop().is_some()) {}
  }

  public retain(f: (element: T, index: number) => boolean) {
    let len = this.len();
    let del = 0;
    {
      for (let i = 0; i < len; ++i) {
        if (!f(this._xs[i], i)) {
          del += 1;
        } else if (del > 0) {
          this.swap(i - del, i);
        }
      }
    }
    if (del > 0) {
      this.drain(range(len - del, len));
    }
  }

  public set_len(length: number) {
    debug_assert(length <= this.capacity());
    this._len = length;
  }

  public drain(range: Range<number>): T[] {
    let len = this.len();
    let start = range.start;
    let end = range.end;
    let drain_len = end - start;

    if (start > end) {
      throw new Error(`ArrayVec.drain: range start ${start} is greater than range end ${end}`);
    } else if (end > len) {
      panic_oob("drain", end, len);
    }

    this.set_len(len - drain_len);
    return this._xs.splice(start, end - start);
  }

  public into_inner(): Result<T[], this["Self"]> {
    if (this.len() < this.capacity()) {
      return Err(this as this["Self"]);
    } else {
      return Ok([...this._xs]);
    }
  }

  public as_slice(): T[] {
    return [...this._xs];
  }

  public eq(other: this["Self"]): boolean {
    return eq(this.as_slice(), other.as_slice());
  }

  // Clone
  // TODO: make this better
  public clone(): this["Self"] {
    let ret: ArrayVec<T> = new ArrayVec(this.capacity());
    ret._xs = clone(this._xs);
    ret._len = this.len();
    return ret;
  }

  public cmp(other: ArrayVec<T>): Ordering {
    return cmp(this.as_slice(), other.as_slice());
  }

  public partial_cmp(other: ArrayVec<T>): Option<Ordering> {
    return partial_cmp(this.as_slice(), other.as_slice());
  }

  // Debug
  public fmt_debug(): string {
    return format("{:?}", this._xs);
  }

  public static default<T>(): ArrayVec<T> {
    return new ArrayVec(0);
  }
}

export class ArrayVecIntoIter<T> extends ExactSizeAndDoubleEndedIterator {
  public Self!: ArrayVecIntoIter<T>;

  private index: number;
  private v: ArrayVec<T>;

  public Item!: T;

  public constructor(v: ArrayVec<T>) {
    super();
    this.index = 0;
    this.v = v;
  }

  public next(): Option<this["Item"]> {
    if (this.index === this.v.len()) {
      return None();
    } else {
      let index = this.index;
      this.index += 1;
      return Some(this.v.get_unchecked(index));
    }
  }

  public size_hint(): [number, Option<number>] {
    let len = this.v.len() - this.index;
    return [len, Some(len)];
  }

  public next_back(): Option<this["Item"]> {
    if (this.index === this.v.len()) {
      return None();
    } else {
      let new_len = this.v.len() - 1;
      this.v.set_len(new_len);
      return Some(this.v.get_unchecked(new_len));
    }
  }

  // Clone
  public clone(): ArrayVecIntoIter<T> {
    return new ArrayVecIntoIter(ArrayVec.from(this.v.slice(this.index)));
  }
}

export class CapacityError<T> extends Error {
  element: T;

  constructor(element: T) {
    super("CapacityError: insufficient capacity");
    this.element = element;
  }
}

function panic_oob(method_name: string, index: number, len: number) {
  throw new Error(
    `ArrayVec.${method_name}: index ${index} is out of bounds in vector of length ${len}`
  );
}
