import { ArrayVec } from "../src/arrayvec";
import { Range } from "@rusts/std";

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
      expect(
        elt.unwrap().reduce((acc: number, v: number) => {
          return (acc += v);
        })
      ).toEqual(10);
    }
  });

  test("from", () => {
    let vec = ArrayVec.from([0, 1, 2]);

    expect(vec.len()).toEqual(3);
    expect(vec.capacity()).toEqual(3);
    expect(vec.as_array()).toEqual([0, 1, 2]);
    expect(vec.into_inner().unwrap()).toEqual([0, 1, 2]);
  });

  test("capcity_left", () => {
    let vec: ArrayVec<number> = new ArrayVec(4);
    expect(vec.remaining_capacity()).toEqual(4);
    vec.push(1);
    expect(vec.remaining_capacity()).toEqual(3);
    vec.push(2);
    expect(vec.remaining_capacity()).toEqual(2);
    vec.push(3);
    expect(vec.remaining_capacity()).toEqual(1);
    vec.push(4);
    expect(vec.remaining_capacity()).toEqual(0);
  });

  test("set_len", () => {
    let v = new ArrayVec<number>(5);
    expect(v.len()).toEqual(0);
    v.set_len(5);
    expect(v.len()).toEqual(5);
  });

  test("set_len_oob", () => {
    let v = new ArrayVec<number>(5);
    expect(() => {
      v.set_len(6);
    }).toThrow();
  });

  test("clear", () => {
    let v = ArrayVec.from([0, 0, 0, 0, 0, 0, 0, 0]);
    v.clear();
    expect(v.as_array()).toEqual([]);
  });

  test("truncate", () => {
    let v = ArrayVec.from([0, 0, 0, 0, 0, 0, 0, 0]);
    v.truncate(4);
    expect(v.len()).toEqual(4);
  });

  test("drain", () => {
    let v = ArrayVec.from([0, 0, 0, 0, 0, 0, 0, 0]);
    v.pop();
    v.drain(new Range(0, 7));
    expect(v.as_array()).toEqual([]);
  });

  test("retain", () => {
    let v = ArrayVec.from([0, 1, 2, 3, 4, 5, 6, 7]);
    v.retain(() => true);
    expect(v.as_array()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    v.retain((elt, i) => {
      v.set(i, Math.floor(elt / 2));
      return v.get(i).unwrap() % 2 === 0;
    });
    expect(v.as_array()).toEqual([0, 0, 2, 2]);
    v.retain(() => false);
    expect(v.as_array()).toEqual([]);
  });

  test("drain_oob", () => {
    let v = ArrayVec.from([0, 1, 2, 3, 4, 5, 6, 7]);
    v.pop();
    expect(() => {
      v.drain(new Range(0, 8));
    }).toThrow();
  });

  test("drain_invalid range", () => {
    let v = ArrayVec.from([0]);
    expect(() => {
      v.drain(new Range(8, 0));
    }).toThrow();
  });

  test("insert", () => {
    let v: ArrayVec<number> = ArrayVec.from([]);
    expect(v.try_push(1).is_err()).toBe(true);

    v = new ArrayVec(3);
    v.insert(0, 0);
    v.insert(1, 1);
    expect(v.as_array()).toEqual([0, 1]);
    v.insert(2, 2);
    expect(v.as_array()).toEqual([0, 1, 2]);

    let ret2 = v.try_insert(1, 9);
    expect(v.as_array()).toEqual([0, 1, 2]);
    expect(ret2.is_err()).toBe(true);

    v = ArrayVec.from([2]);
    expect(v.try_insert(0, 1).is_err()).toBe(true);
    expect(v.try_insert(1, 1).is_err()).toBe(true);
  });

  test("into_inner_ok", () => {
    let v = new ArrayVec<string>(4);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");
    expect(v.into_inner().unwrap()).toEqual(["a", "b", "c", "d"]);
  });

  test("into_inner_err", () => {
    let v = ArrayVec.from([1, 2]);
    v.pop();
    expect(v.into_inner().unwrap_err()).toEqual(v);
  });

  test("get", () => {
    let v = new ArrayVec<string>(3);
    v.push("a");
    v.push("b");
    v.push("c");

    expect(v.get(0).unwrap()).toEqual("a");
    expect(v.get(1).unwrap()).toEqual("b");
    expect(v.get(2).unwrap()).toEqual("c");
    expect(v.get(3).is_none()).toBe(true);
  });

  test("remove", () => {
    let v = new ArrayVec<string>(4);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");

    expect(v.remove(1)).toEqual("b");
    expect(v.remove(1)).toEqual("c");
    expect(v.as_array()).toEqual(["a", "d"]);
  });

  test("remove_oob", () => {
    let v = new ArrayVec<string>(4);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");

    expect(() => {
      v.remove(4);
    }).toThrow();
  });

  test("pop_at", () => {
    let v = new ArrayVec<string>(4);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");

    expect(v.pop_at(4).is_none()).toBe(true);
    expect(v.pop_at(1).unwrap()).toEqual("b");
    expect(v.pop_at(1).unwrap()).toEqual("c");
    expect(v.pop_at(2).is_none()).toBe(true);
    expect(v.as_array()).toEqual(["a", "d"]);
  });

  test("swap_remove", () => {
    let v = new ArrayVec<string>(5);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");
    v.push("e");

    expect(v.swap_remove(1)).toEqual("b");
    expect(v.swap_remove(1)).toEqual("e");
    expect(v.swap_remove(1)).toEqual("d");
    expect(v.as_array()).toEqual(["a", "c"]);
  });

  test("swap_remove_oob", () => {
    let v = new ArrayVec<string>(5);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");
    v.push("e");

    expect(() => {
      v.remove(5);
    }).toThrow();
  });

  test("swap_pop", () => {
    let v = new ArrayVec<string>(5);
    v.push("a");
    v.push("b");
    v.push("c");
    v.push("d");
    v.push("e");

    expect(v.swap_pop(5).is_none()).toBe(true);
    expect(v.swap_pop(1).unwrap()).toEqual("b");
    expect(v.swap_pop(1).unwrap()).toEqual("e");
    expect(v.swap_pop(1).unwrap()).toEqual("d");
    expect(v.swap_pop(3).is_none()).toBe(true);
    expect(v.as_array()).toEqual(["a", "c"]);
  });
});
