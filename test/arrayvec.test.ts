import { ArrayVec } from "../src/arrayvec";
import { add, None, Some, Range, Less, Equal, Greater } from "@rusts/std";
const { assert, assert_eq, should_panic } = require("@rusts/std/dist/lib/macros.test");

test("exports ArrayVec", () => {
  expect(ArrayVec).toBeDefined();
});

describe("ArrayVec", () => {
  test("simple", () => {
    let vec: ArrayVec<number[]> = new ArrayVec(3);

    vec.push([1, 2, 3, 4]);
    vec.push([10]);
    vec.push([-1, 13, -2]);

    for (let elt of vec) {
      assert_eq(elt.iter().fold(0, add), 10);
    }

    let sum_len = vec
      .into_iter()
      .map((x: number[]) => x.len())
      .fold(0, add);
    assert_eq(sum_len, 8);
  });

  test("from", () => {
    let vec = ArrayVec.from([0, 1, 2]);

    assert_eq(vec.len(), 3);
    assert_eq(vec.capacity(), 3);
    assert_eq(vec.as_slice(), [0, 1, 2]);
    assert_eq(vec.into_inner().unwrap(), [0, 1, 2]);
  });

  test("iter", () => {
    let iter = ArrayVec.from([1, 2, 3]).into_iter();
    assert_eq(iter.size_hint(), [3, Some(3)]);
    assert_eq(iter.next_back(), Some(3));
    assert_eq(iter.next(), Some(1));
    assert_eq(iter.next_back(), Some(2));
    assert_eq(iter.size_hint(), [0, Some(0)]);
    assert_eq(iter.next_back(), None());
  });

  test("eq", () => {
    let v1 = ArrayVec.from([0, 1, 2]);
    let v2 = ArrayVec.from([0, 1, 2]);

    assert_eq(v1, v2);
  });

  test("clone", () => {
    let v1 = ArrayVec.from([0, 1, 2]);
    let v2 = v1.clone();

    // Compare by reference
    assert(v1 !== v2);
    // Compare by value
    assert_eq(v1, v2);
  });

  test("fmt_debug", () => {
    let v = ArrayVec.from([0, 1, 2]);

    assert_eq(v.fmt_debug(), "[0,1,2]");
  });

  test("cmp", () => {
    let v1 = ArrayVec.from([0, 1, 2]);
    let v2 = ArrayVec.from([1, 2, 3]);
    let v3 = ArrayVec.from([0, 1, 2, 3]);

    assert_eq(v1.cmp(v1), Equal);
    assert_eq(v1.cmp(v2), Less);
    assert_eq(v2.cmp(v1), Greater);
    assert_eq(v1.cmp(v3), Less);
    assert_eq(v3.cmp(v2), Less);
  });

  test("capcity_left", () => {
    let vec: ArrayVec<number> = new ArrayVec(4);
    assert_eq(vec.remaining_capacity(), 4);
    vec.push(1);
    assert_eq(vec.remaining_capacity(), 3);
    vec.push(2);
    assert_eq(vec.remaining_capacity(), 2);
    vec.push(3);
    assert_eq(vec.remaining_capacity(), 1);
    vec.push(4);
    assert_eq(vec.remaining_capacity(), 0);
  });

  test("set_len", () => {
    let v = new ArrayVec<number>(5);
    assert_eq(v.len(), 0);
    v.set_len(5);
    assert_eq(v.len(), 5);
  });

  test("clear", () => {
    let v = ArrayVec.from([0, 0, 0, 0, 0, 0, 0, 0]);
    v.clear();
    assert_eq(v.as_slice(), []);
  });

  test("truncate", () => {
    let v = ArrayVec.from([0, 0, 0, 0, 0, 0, 0, 0]);
    v.truncate(4);
    assert_eq(v.len(), 4);
  });

  test("drain", () => {
    let v = ArrayVec.from([0, 0, 0, 0, 0, 0, 0, 0]);
    v.pop();
    v.drain(new Range(0, 7));
    assert_eq(v.as_slice(), []);
  });

  test("retain", () => {
    let v = ArrayVec.from([0, 1, 2, 3, 4, 5, 6, 7]);
    v.retain(() => true);
    assert_eq(v.as_slice(), [0, 1, 2, 3, 4, 5, 6, 7]);
    v.retain((elt, i) => {
      v.set(i, Math.floor(elt / 2));
      return v.get(i).unwrap() % 2 === 0;
    });
    assert_eq(v.as_slice(), [0, 0, 2, 2]);
    v.retain(() => false);
    assert_eq(v.as_slice(), []);
  });

  test("drain_oob", () => {
    let v = ArrayVec.from([0, 1, 2, 3, 4, 5, 6, 7]);
    v.pop();
    should_panic(() => {
      v.drain(new Range(0, 8));
    });
  });

  test("drain_invalid range", () => {
    let v = ArrayVec.from([0]);
    should_panic(() => {
      v.drain(new Range(8, 0));
    });
  });

  test("insert", () => {
    let v: ArrayVec<number> = ArrayVec.from<number>([]);
    assert(v.try_push(1).is_err());

    v = new ArrayVec(3);
    v.insert(0, 0);
    v.insert(1, 1);
    assert_eq(v.as_slice(), [0, 1]);
    v.insert(2, 2);
    assert_eq(v.as_slice(), [0, 1, 2]);

    let ret2 = v.try_insert(1, 9);
    assert_eq(v.as_slice(), [0, 1, 2]);
    assert(ret2.is_err());

    v = ArrayVec.from([2]);
    assert(v.try_insert(0, 1).is_err());
    assert(v.try_insert(1, 1).is_err());
  });

  test("into_inner_ok", () => {
    let v = new ArrayVec<string>(4);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");
    assert_eq(v.into_inner().unwrap(), ["a", "b", "c", "d"]);
  });

  test("into_inner_err", () => {
    let v = ArrayVec.from([1, 2]);
    v.pop();
    assert_eq(v.into_inner().unwrap_err(), v);
  });

  test("get", () => {
    let v = new ArrayVec<string>(3);
    v.push("a");
    v.push("b");
    v.push("c");

    assert_eq(v.get(0).unwrap(), "a");
    assert_eq(v.get(1).unwrap(), "b");
    assert_eq(v.get(2).unwrap(), "c");
    assert(v.get(3).is_none());
  });

  test("remove", () => {
    let v = new ArrayVec<string>(4);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");

    assert_eq(v.remove(1), "b");
    assert_eq(v.remove(1), "c");
    assert_eq(v.as_slice(), ["a", "d"]);
  });

  test("remove_oob", () => {
    let v = new ArrayVec<string>(4);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");

    should_panic(() => {
      v.remove(4);
    });
  });

  test("pop_at", () => {
    let v = new ArrayVec<string>(4);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");

    assert(v.pop_at(4).is_none());
    assert_eq(v.pop_at(1).unwrap(), "b");
    assert_eq(v.pop_at(1).unwrap(), "c");
    assert(v.pop_at(2).is_none());
    assert_eq(v.as_slice(), ["a", "d"]);
  });

  test("swap_remove", () => {
    let v = new ArrayVec<string>(5);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");
    v.push("e");

    assert_eq(v.swap_remove(1), "b");
    assert_eq(v.swap_remove(1), "e");
    assert_eq(v.swap_remove(1), "d");
    assert_eq(v.as_slice(), ["a", "c"]);
  });

  test("swap_remove_oob", () => {
    let v = new ArrayVec<string>(5);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");
    v.push("e");

    should_panic(() => {
      v.remove(5);
    });
  });

  test("swap_pop", () => {
    let v = new ArrayVec<string>(5);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");
    v.push("e");

    assert(v.swap_pop(5).is_none());
    assert_eq(v.swap_pop(1).unwrap(), "b");
    assert_eq(v.swap_pop(1).unwrap(), "e");
    assert_eq(v.swap_pop(1).unwrap(), "d");
    assert(v.swap_pop(3).is_none());
    assert_eq(v.as_slice(), ["a", "c"]);
  });

  test("insert_at_length", () => {
    let v = new ArrayVec<string>(8);
    let result1 = v.try_insert(0, "a");
    let result2 = v.try_insert(1, "b");
    assert(result1.is_ok() && result2.is_ok());
    assert_eq(v.as_slice(), ["a", "b"]);
  });

  test("insert_out_of_bounds", () => {
    let v = new ArrayVec<string>(8);
    should_panic(() => {
      v.try_insert(1, "test");
    });
  });
});
