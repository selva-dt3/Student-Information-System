import {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../studentService";

// Mock the Supabase client and env
jest.mock("../../lib/supabaseClient", () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock("../../config/env", () => ({
  getEnv: () => ({
    SUPABASE_URL: "http://example.test",
    SUPABASE_ANON_KEY: "anon",
    FEATURE_FLAGS: [],
    LOG_LEVEL: "error",
  }),
}));

jest.mock("../errorMapping", () => {
  const actual = jest.requireActual("../errorMapping");
  return {
    ...actual,
    // keep map function behavior simple while spying on log
    logMinimalError: jest.fn(),
  };
});

const { getSupabaseClient } = require("../../lib/supabaseClient");
const { logMinimalError } = require("../errorMapping);

function makeFromMock() {
  // Build a chainable supabase.from("students") mock with methods select/order/range/eq/update/insert/delete/single
  const chain = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.range = jest.fn().mockResolvedValue({ data: [], error: null, count: 0 });
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.delete = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockResolvedValue({ data: { id: "1" }, error: null });
  return chain;
}

describe("studentService", () => {
  let supabaseMock;

  beforeEach(() => {
    jest.clearAllMocks();
    const fromChain = makeFromMock();
    supabaseMock = {
      from: jest.fn().mockReturnValue(fromChain),
    };
    getSupabaseClient.mockReturnValue(supabaseMock);
  });

  describe("listStudents", () => {
    it("returns data and count on success", async () => {
      const chain = supabaseMock.from.mock.results[0].value;
      chain.range.mockResolvedValueOnce({
        data: [{ id: 1, name: "John", email: "j@example.com" }],
        error: null,
        count: 5,
      });

      const res = await listStudents({ limit: 10, offset: 0 });
      expect(supabaseMock.from).toHaveBeenCalledWith("students");
      expect(chain.select).toHaveBeenCalledWith("*", { count: "exact" });
      expect(chain.order).toHaveBeenCalled();
      expect(chain.range).toHaveBeenCalledWith(0, 9);
      expect(res).toEqual({ data: [{ id: 1, name: "John", email: "j@example.com" }], count: 5 });
    });

    it("throws mapped error on failure", async () => {
      const chain = supabaseMock.from.mock.results[0].value;
      chain.range.mockResolvedValueOnce({ data: null, error: { code: "42501", message: "permission denied" }, count: null });

      await expect(listStudents()).rejects.toThrow(/You do not have permission/i);
      expect(logMinimalError).toHaveBeenCalled();
    });
  });

  describe("getStudentById", () => {
    it("fetches single student", async () => {
      const chain = supabaseMock.from.mock.results[0].value;
      chain.single.mockResolvedValueOnce({ data: { id: "abc", email: "a@b.com" }, error: null });

      const data = await getStudentById("abc");
      expect(supabaseMock.from).toHaveBeenCalledWith("students");
      expect(chain.select).toHaveBeenCalledWith("*");
      expect(chain.eq).toHaveBeenCalledWith("id", "abc");
      expect(chain.single).toHaveBeenCalled();
      expect(data).toEqual({ id: "abc", email: "a@b.com" });
    });

    it("requires id", async () => {
      await expect(getStudentById()).rejects.toThrow(/requires 'id'/i);
    });

    it("maps error properly", async () => {
      const chain = supabaseMock.from.mock.results[0].value;
      chain.single.mockResolvedValueOnce({ data: null, error: { code: "23502", message: "not null violation" } });
      await expect(getStudentById("x")).rejects.toThrow(/Required data is missing/i);
      expect(logMinimalError).toHaveBeenCalled();
    });
  });

  describe("createStudent", () => {
    it("inserts and returns created row", async () => {
      const chain = supabaseMock.from.mock.results[0].value;
      chain.single.mockResolvedValueOnce({ data: { id: "1", email: "a@b.com" }, error: null });

      const payload = { firstName: "A", lastName: "B", email: "a@b.com" };
      const res = await createStudent(payload);
      expect(supabaseMock.from).toHaveBeenCalledWith("students");
      expect(chain.insert).toHaveBeenCalledWith(payload);
      expect(chain.select).toHaveBeenCalled();
      expect(chain.single).toHaveBeenCalled();
      expect(res).toEqual({ id: "1", email: "a@b.com" });
    });

    it("validates payload object", async () => {
      await expect(createStudent(null)).rejects.toThrow(/requires a payload object/i);
    });

    it("maps insert error", async () => {
      const chain = supabaseMock.from.mock.results[0].value;
      chain.single.mockResolvedValueOnce({ data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } });

      await expect(createStudent({ email: "dup@e.com" })).rejects.toThrow(/must be unique/i);
      expect(logMinimalError).toHaveBeenCalled();
    });
  });

  describe("updateStudent", () => {
    it("updates and returns updated row", async () => {
      const chain = supabaseMock.from.mock.results[0].value;
      chain.single.mockResolvedValueOnce({ data: { id: "1", email: "new@e.com" }, error: null });

      const res = await updateStudent("1", { email: "new@e.com" });
      expect(chain.update).toHaveBeenCalledWith({ email: "new@e.com" });
      expect(chain.eq).toHaveBeenCalledWith("id", "1");
      expect(res).toEqual({ id: "1", email: "new@e.com" });
    });

    it("validates args", async () => {
      await expect(updateStudent(null, {})).rejects.toThrow(/requires 'id'/i);
      await expect(updateStudent("1", null)).rejects.toThrow(/requires an updates object/i);
    });

    it("maps update error", async () => {
      const chain = supabaseMock.from.mock.results[0].value;
      chain.single.mockResolvedValueOnce({ data: null, error: { code: "42501", message: "permission denied" } });

      await expect(updateStudent("1", { email: "x@y.com" })).rejects.toThrow(/do not have permission/i);
      expect(logMinimalError).toHaveBeenCalled();
    });
  });

  describe("deleteStudent", () => {
    it("deletes by id and returns true", async () => {
      const chain = supabaseMock.from.mock.results[0].value;
      chain.delete.mockReturnValueOnce(chain);
      chain.eq.mockResolvedValueOnce({ error: null });

      const res = await deleteStudent("1");
      expect(supabaseMock.from).toHaveBeenCalledWith("students");
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "1");
      expect(res).toBe(true);
    });

    it("requires id", async () => {
      await expect(deleteStudent()).rejects.toThrow(/requires 'id'/i);
    });

    it("maps delete error", async () => {
      const chain = supabaseMock.from.mock.results[0].value;
      chain.eq.mockResolvedValueOnce({ error: { code: "42501", message: "permission denied" } });

      await expect(deleteStudent("2")).rejects.toThrow(/do not have permission/i);
      expect(logMinimalError).toHaveBeenCalled();
    });
  });
});
