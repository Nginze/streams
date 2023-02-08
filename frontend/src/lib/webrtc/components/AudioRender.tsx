import React, { useEffect, useRef, useState } from "react";
import { useConsumerStore } from "../store/useConsumerStore";

interface AudioRenderProps {}

type Props = React.DetailedHTMLProps<
  React.AudioHTMLAttributes<HTMLAudioElement>,
  HTMLAudioElement
> & {
  onRef: (a: HTMLAudioElement) => void;
  volume: number;
};

const AudioComponent = ({ volume, onRef, ...props }: Props) => {
  const myRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (myRef.current) {
      myRef.current.volume = volume;
    }
  }, [volume]);
  return (
    <audio
      ref={r => {
        if (r && !myRef.current) {
          (myRef as any).current = r;
          onRef(r);
        }
      }}
      {...props}
    ></audio>
  );
};
const AudioRender: React.FC<AudioRenderProps> = () => {
  const { consumerMap, setAudioRef } = useConsumerStore();
  const audioRefs = useRef<Array<[string, HTMLAudioElement]>>([]);
  const [showAutoPlayModal, setShowAutoPlayModal] = useState(false);
  return (
    <div
      className={`absolute top-0 w-full h-full flex z-50 bg-primary-900 ${
        showAutoPlayModal ? "" : "hidden"
      }`}
    >
      {Object.keys(consumerMap).map(k => {
        const { consumer, volume: peerVolume } = consumerMap[k];
        return (
          <AudioComponent
            key={consumer.id}
            volume={0.8}
            onRef={a => {
              setAudioRef(k, a);
              audioRefs.current.push([k, a]);
              a.srcObject = new MediaStream([consumer.track]);
              console.log("about to play track from on ref");
              a.play().catch(err => console.log(err));
            }}
          />
        );
      })}
      {/* <div className={`flex p-8 rounded m-auto bg-primary-700 flex-col`}>
        <div className={`flex text-center mb-4 text-primary-100`}>
          Browsers require user interaction before they will play audio. Just
          click okay to continue.
        </div>
        <button
          onClick={() => {
            setShowAutoPlayModal(false);
            audioRefs.current.forEach(([_, a]) => {
              a.play().catch(err => {
                console.warn(err);
              });
            });
          }}
        >
          okay
        </button>
      </div> */}
    </div>
  );
};

export default AudioRender;
