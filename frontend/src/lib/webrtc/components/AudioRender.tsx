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
    <>
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
              a.play().catch(err => {
                console.log(err);
                setShowAutoPlayModal(true);
              });
            }}
          />
        );
      })}
      {showAutoPlayModal && (
        <div className="w-96 h-auto absolute right-0 mt-5 bg-neutral-800 z-50 text-white px-5 py-4">
          <div className={`flex text-center mb-4 text-primary-100`}>
            Browsers require user interaction before they will play audio. Just
            click okay to continue.
          </div>
          <button
            className="w-full mb-3 bg-blue-600 px-2 py-3"
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
        </div>
      )}
    </>
  );
};

export default AudioRender;
