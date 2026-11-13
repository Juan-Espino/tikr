// Browser payloads are hints only. The server compares each content hash with a
// freshly read authoritative manifest before admitting it to a calculation.
export type HistoryChunk = { key: string; payload: string; revision: string };
export const HISTORY_PROTOCOL = "alpaca:sip:raw:payment-close:0900:monthly-v1";
export const HISTORY_TRANSFER_BYTES = 2_000_000;
