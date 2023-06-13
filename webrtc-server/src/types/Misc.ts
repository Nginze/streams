import {
  MediaKind,
  RtpCapabilities,
  RtpParameters,
} from "mediasoup/node/lib/RtpParameters";
import { Transport } from "mediasoup/node/lib/Transport";
import { DtlsParameters } from "mediasoup/node/lib/WebRtcTransport";
import { TransportOptions } from "../utils/createTransport";
import { Consumer } from "../utils/createConsumer";
import { VoiceSendDirection } from "./VoiceSendDirection";
import { ConsumerType } from "mediasoup/node/lib/Consumer";

export type RecvDTO = {
  roomId: string;
  peerId: string;
  userId?: string;
  transportId?: string;
  paused?: boolean;
  appData?: any;
  rtpCapabilities?: RtpCapabilities;
  dtlsParameters?: DtlsParameters;
  kind?: MediaKind;
  rtpParameters?: RtpParameters;
  direction?: VoiceSendDirection;
};

export type SendDTO = {
  roomId: string;
  peerId?: string;
  routerRtpCapabilities?: RtpCapabilities;
  recvTransportOptions?: TransportOptions;
  sendTransportOptions?: TransportOptions;
  sendTransport?: Transport;
  dtlsParameters?: DtlsParameters;
  rtpCapabilities?: RtpCapabilities;
  rtpParameters?: RtpParameters;
  consumerParameters?: {
    producerId: string;
    id: string;
    kind: string;
    rtpParameters: RtpParameters;
    type: ConsumerType;
    producerPaused: boolean;
  };
  consumerParametersArr?: Consumer[];
  kicked?: boolean;
  userId?: string;
  transportId?: string;
  producerId?: String;
  direction?: string;
  kind?: string;
  paused?: boolean;
  appData?: any;
  error?: any;
  id?: string;
};

export type SendParams = {
  op: string;
  peerId?: String;
  d: SendDTO | string;
};
