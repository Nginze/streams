import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useIdStore = create(combine({ id: "" }, set => ({ set })));
