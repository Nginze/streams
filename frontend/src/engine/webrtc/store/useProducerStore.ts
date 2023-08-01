import { create } from "zustand";
import { combine } from "zustand/middleware";
import { Producer } from "mediasoup-client/lib/Producer";

export const useProducerStore = create(
  combine(
    {
      producer: null as Producer | null,
    },
    set => ({
      add: (p: Producer) => {
        set(s => {
          if (s.producer && !s.producer.closed) {
            s.producer.close();
          }
          return { producer: p };
        });
      },
      close: () => {
        set(s => {
          if (s.producer && !s.producer.closed) {
            s.producer.close();
          }
          return {
            producer: null,
          };
        });
      },
    })
  )
);
